// === Conversation Engine ===
// The brain of Kshama — processes each message through the full pipeline

import Anthropic from '@anthropic-ai/sdk';
import { getServerSupabase } from './supabase';
import { buildSystemPrompt } from './prompts';
import { retrieveKnowledge, formatKnowledgeForPrompt } from './rag';
import type { ChatRequest, ChatResponse, LeadScore, LeadSignals, RichContent } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// --- Parse Claude's response to extract rich content and lead signals ---
function parseAgentResponse(raw: string): {
  message: string;
  richContent: RichContent[];
  leadSignals: LeadSignals | null;
} {
  let message = raw;
  const richContent: RichContent[] = [];
  let leadSignals: LeadSignals | null = null;

  // Extract rich_content blocks
  const richMatch = message.match(/```rich_content\s*([\s\S]*?)```/);
  if (richMatch) {
    try {
      const parsed = JSON.parse(richMatch[1].trim());
      if (Array.isArray(parsed)) {
        richContent.push(...parsed);
      } else {
        richContent.push(parsed);
      }
    } catch (e) {
      console.warn('Failed to parse rich_content:', e);
    }
    message = message.replace(/```rich_content\s*[\s\S]*?```/, '').trim();
  }

  // Extract lead_signals block
  const signalsMatch = message.match(/```lead_signals\s*([\s\S]*?)```/);
  if (signalsMatch) {
    try {
      leadSignals = JSON.parse(signalsMatch[1].trim());
    } catch (e) {
      console.warn('Failed to parse lead_signals:', e);
    }
    message = message.replace(/```lead_signals\s*[\s\S]*?```/, '').trim();
  }

  return { message, richContent, leadSignals };
}

// --- Calculate lead score from signals ---
function calculateLeadScore(signals: LeadSignals, thresholds: { hot: number; warm: number }): LeadScore {
  const total = Object.values(signals).reduce((sum, val) => sum + val, 0);
  if (total >= thresholds.hot) return 'hot';
  if (total >= thresholds.warm) return 'warm';
  if (total > 0) return 'nurture';
  return 'unscored';
}

// --- Merge lead signals (take the max of each) ---
function mergeSignals(existing: LeadSignals, updated: LeadSignals | null): LeadSignals {
  if (!updated) return existing;
  return {
    role_seniority: Math.max(existing.role_seniority, updated.role_seniority || 0),
    company_size: Math.max(existing.company_size, updated.company_size || 0),
    urgency: Math.max(existing.urgency, updated.urgency || 0),
    budget_signals: Math.max(existing.budget_signals, updated.budget_signals || 0),
    ai_maturity: Math.max(existing.ai_maturity, updated.ai_maturity || 0),
    engagement_depth: Math.max(existing.engagement_depth, updated.engagement_depth || 0),
  };
}

// === MAIN CONVERSATION HANDLER ===
export async function processMessage(request: ChatRequest): Promise<ChatResponse> {
  const supabase = getServerSupabase();
  const { visitor_id, message, page_url, metadata = {} } = request;
  let conversationId = request.conversation_id;

  // --- 1. Get or create conversation ---
  let conversation;
  if (conversationId) {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    conversation = data;
  }

  if (!conversation) {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        visitor_id,
        page_url,
        status: 'active',
        metadata,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create conversation: ${error.message}`);
    conversation = data;
    conversationId = data.id;
  }

  // --- 2. Store user message ---
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: message,
  });

  // --- 3. Load conversation history ---
  const { data: historyData } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(30); // Keep last 30 messages for context

  const history = (historyData || []).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // --- 4. Retrieve relevant knowledge ---
  const knowledgeItems = await retrieveKnowledge(message, {
    maxResults: 4,
  });
  const knowledgeContext = formatKnowledgeForPrompt(knowledgeItems);

  // --- 5. Build system prompt ---
  const currentSignals: LeadSignals = conversation.lead_signals || {
    role_seniority: 0, company_size: 0, urgency: 0,
    budget_signals: 0, ai_maturity: 0, engagement_depth: 0,
  };

  const systemPrompt = buildSystemPrompt({
    pageUrl: page_url,
    visitorName: conversation.visitor_name,
    conversationHistory: history,
    knowledgeContext,
    currentLeadSignals: currentSignals,
  });

  // --- 6. Call Claude ---
  const claudeMessages = history.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: claudeMessages,
  });

  const rawContent = response.content
    .filter(block => block.type === 'text')
    .map(block => 'text' in block ? block.text : '')
    .join('');

  // --- 7. Parse response ---
  const { message: agentMessage, richContent, leadSignals } = parseAgentResponse(rawContent);

  // --- 8. Update lead signals and score ---
  const mergedSignals = mergeSignals(currentSignals, leadSignals);
  const thresholds = { hot: 12, warm: 7 }; // Default thresholds
  const leadScore = calculateLeadScore(mergedSignals, thresholds);

  // Increment engagement depth based on message count
  mergedSignals.engagement_depth = Math.min(3, Math.floor(history.length / 4));

  // --- 9. Store agent response ---
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content: agentMessage,
    rich_content: richContent.length > 0 ? richContent : null,
  });

  // --- 10. Update conversation ---
  const updateData: Record<string, unknown> = {
    lead_score: leadScore,
    lead_signals: mergedSignals,
  };

  // Check if visitor shared their name or email in the message
  const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    updateData.visitor_email = emailMatch[0];
    // Also update/create visitor session
    await supabase.from('visitor_sessions').upsert({
      visitor_id,
      email: emailMatch[0],
      last_seen: new Date().toISOString(),
    }, { onConflict: 'visitor_id' });
  }

  await supabase
    .from('conversations')
    .update(updateData)
    .eq('id', conversationId);

  // --- 11. Determine UI actions ---
  const shouldShowCalendly = leadScore === 'hot' ||
    richContent.some(rc => rc.type === 'calendly_cta');

  const shouldCaptureEmail = !conversation.visitor_email &&
    (leadScore === 'nurture' || leadScore === 'warm') &&
    history.length >= 6;

  return {
    conversation_id: conversationId!,
    message: agentMessage,
    rich_content: richContent.length > 0 ? richContent : null,
    lead_score: leadScore,
    should_show_calendly: shouldShowCalendly,
    should_capture_email: shouldCaptureEmail,
  };
}
