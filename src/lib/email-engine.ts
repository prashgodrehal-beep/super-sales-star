// === Email Draft Engine ===
// Generates personalized follow-up emails in Kshama's voice
// Drafts go to approval queue — Prashanth reviews before sending

import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { getServerSupabase } from './supabase';
import type { EmailTrigger } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const resend = new Resend(process.env.RESEND_API_KEY || '');

// --- Generate email draft ---
export async function generateEmailDraft(
  conversationId: string,
  trigger: EmailTrigger
): Promise<{ subject: string; bodyHtml: string; bodyText: string } | null> {
  const supabase = getServerSupabase();

  // Load conversation and messages
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (!conversation || !conversation.visitor_email) return null;

  const { data: messages } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (!messages || messages.length === 0) return null;

  // Build conversation transcript
  const transcript = messages
    .map(m => `${m.role === 'user' ? 'Visitor' : 'Kshama'}: ${m.content}`)
    .join('\n\n');

  // Determine email type
  const emailPrompts: Record<EmailTrigger, string> = {
    post_conversation: `Generate a follow-up email after a conversation. The email should:
- Reference specific topics discussed
- Include 2-3 key points from the conversation as a recap
- Suggest a relevant resource or next step
- Include a subtle invitation to continue the conversation or book a call with Prashanth
- End with a warm, personal sign-off from Kshama`,

    post_booking: `Generate a pre-call preparation email after the visitor booked a Calendly call. The email should:
- Express genuine appreciation for booking the call
- Briefly recap what was discussed so they know Prashanth will be prepared
- Mention 1-2 things Prashanth will want to explore with them
- Build anticipation for the call
- Keep it concise — they already committed`,

    nurture_followup: `Generate a nurture follow-up email for a visitor who engaged but didn't book a call. The email should:
- Reference their specific situation or challenge
- Share one relevant case study or insight
- Offer a low-commitment next step (resource download, short article, or video)
- Leave the door open for a future conversation
- Not be pushy at all — this is about providing value`,
  };

  const systemPrompt = `You are writing an email as Kshama, AI Sales Advisor at GrowthAspire. 
  
The email is from: Kshama <kshama@growthaspire.com>
The email should feel personal, as if Kshama personally reviewed the conversation and is following up.

Style guidelines:
- Warm, consultative, never pushy
- Short paragraphs, easy to scan
- No corporate jargon
- Reference specific details from the conversation
- Include a "Key points" section as a brief recap
- The email represents GrowthAspire and Prashanth Krishna (founder)

Respond with ONLY a JSON object in this exact format:
{
  "subject": "the email subject line",
  "body_text": "plain text version of the email",
  "body_html": "HTML version with simple styling"
}

Do not include any other text outside the JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `${emailPrompts[trigger]}

Visitor name: ${conversation.visitor_name || 'there'}
Visitor email: ${conversation.visitor_email}
Lead score: ${conversation.lead_score}
Calendly booked: ${conversation.calendly_booked}

Conversation transcript:
${transcript}`,
      },
    ],
  });

  const rawContent = response.content
    .filter(block => block.type === 'text')
    .map(block => 'text' in block ? block.text : '')
    .join('');

  try {
    // Clean up potential markdown formatting
    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      subject: parsed.subject,
      bodyHtml: parsed.body_html,
      bodyText: parsed.body_text,
    };
  } catch (e) {
    console.error('Failed to parse email draft:', e, rawContent);
    return null;
  }
}

// --- Create email draft in database ---
export async function createEmailDraft(
  conversationId: string,
  trigger: EmailTrigger
): Promise<string | null> {
  const supabase = getServerSupabase();

  const { data: conversation } = await supabase
    .from('conversations')
    .select('visitor_email, visitor_name')
    .eq('id', conversationId)
    .single();

  if (!conversation?.visitor_email) return null;

  const draft = await generateEmailDraft(conversationId, trigger);
  if (!draft) return null;

  const { data, error } = await supabase
    .from('email_drafts')
    .insert({
      conversation_id: conversationId,
      trigger_type: trigger,
      to_email: conversation.visitor_email,
      to_name: conversation.visitor_name,
      subject: draft.subject,
      body_html: draft.bodyHtml,
      body_text: draft.bodyText,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create email draft:', error);
    return null;
  }

  // Notify Prashanth that an email is pending approval
  await notifyAdmin('email_pending', conversationId, data.id);

  return data.id;
}

// --- Send approved email via Resend ---
export async function sendApprovedEmail(emailDraftId: string): Promise<boolean> {
  const supabase = getServerSupabase();

  const { data: draft } = await supabase
    .from('email_drafts')
    .select('*')
    .eq('id', emailDraftId)
    .single();

  if (!draft || draft.status === 'sent') return false;

  const bodyHtml = draft.edited_body_html || draft.body_html;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Kshama <kshama@growthaspire.com>',
      to: draft.to_email,
      subject: draft.subject,
      html: bodyHtml,
      text: draft.body_text,
    });

    await supabase
      .from('email_drafts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', emailDraftId);

    return true;
  } catch (e) {
    console.error('Failed to send email:', e);
    return false;
  }
}

// --- Notify admin (Prashanth) ---
async function notifyAdmin(type: string, conversationId: string, emailDraftId?: string) {
  const adminEmail = process.env.NOTIFICATION_EMAIL;
  if (!adminEmail) return;

  try {
    const supabase = getServerSupabase();
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`;

    let subject = '';
    let body = '';

    switch (type) {
      case 'email_pending':
        subject = '📧 Kshama: Email draft ready for your review';
        body = `A follow-up email has been drafted and is waiting for your approval.\n\nReview it here: ${dashboardUrl}/emails`;
        break;
      case 'booking':
        subject = '📅 Kshama: New Calendly booking!';
        body = `A visitor just booked a call through Kshama.\n\nView the conversation: ${dashboardUrl}/conversations/${conversationId}`;
        break;
      case 'hot_lead':
        subject = '🔥 Kshama: Hot lead detected!';
        body = `A visitor has been scored as a hot lead.\n\nView conversation: ${dashboardUrl}/conversations/${conversationId}`;
        break;
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Kshama <kshama@growthaspire.com>',
      to: adminEmail,
      subject,
      text: body,
    });

    await supabase.from('notifications').insert({
      type,
      conversation_id: conversationId,
      email_draft_id: emailDraftId || null,
      sent_to: adminEmail,
    });
  } catch (e) {
    console.error('Failed to send admin notification:', e);
  }
}

export { notifyAdmin };
