// === RAG Pipeline - Knowledge Retrieval ===
// Embeds user messages and finds the most relevant knowledge items

import Anthropic from '@anthropic-ai/sdk';
import { getServerSupabase } from './supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// --- Generate embedding for a text using Voyage (via Anthropic) ---
// Note: We use a simple keyword-based fallback if embeddings aren't set up yet.
// For production, switch to Voyage AI embeddings via Anthropic's API.

export async function generateEmbedding(text: string): Promise<number[]> {
  // Using Anthropic's built-in embedding support
  // For MVP, we'll use keyword matching as primary retrieval
  // and upgrade to vector search once embeddings are seeded
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'voyage-3',
        input: [text],
        input_type: 'query',
      }),
    });

    if (!response.ok) {
      console.warn('Voyage API not available, using keyword search fallback');
      return [];
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch {
    console.warn('Embedding generation failed, using keyword search fallback');
    return [];
  }
}

// --- Retrieve relevant knowledge (hybrid: vector + keyword) ---
export async function retrieveKnowledge(
  query: string,
  options: {
    category?: string;
    maxResults?: number;
    threshold?: number;
  } = {}
): Promise<{ title: string; content: string; category: string; similarity: number }[]> {
  const supabase = getServerSupabase();
  const { category, maxResults = 5, threshold = 0.4 } = options;

  // Strategy 1: Try vector search if embeddings exist
  const embedding = await generateEmbedding(query);

  if (embedding.length > 0) {
    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: maxResults,
      filter_category: category || null,
    });

    if (!error && data && data.length > 0) {
      return data.map((item: { title: string; content: string; category: string; similarity: number }) => ({
        title: item.title,
        content: item.content,
        category: item.category,
        similarity: item.similarity,
      }));
    }
  }

  // Strategy 2: Keyword-based fallback (always works, no embeddings needed)
  return keywordSearch(query, category, maxResults);
}

// --- Keyword-based search fallback ---
async function keywordSearch(
  query: string,
  category?: string,
  maxResults: number = 5
): Promise<{ title: string; content: string; category: string; similarity: number }[]> {
  const supabase = getServerSupabase();

  // Extract meaningful keywords from the query
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'i', 'you', 'we', 'they', 'he', 'she', 'it', 'my', 'your', 'our', 'their', 'this', 'that', 'what', 'how', 'when', 'where', 'why', 'about', 'with', 'from', 'for', 'of', 'to', 'in', 'on', 'at', 'by', 'and', 'or', 'not', 'but', 'so', 'if', 'me', 'want', 'need', 'help', 'tell', 'show', 'know', 'like', 'more']);

  const keywords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  if (keywords.length === 0) {
    // Return general program info if no keywords
    const { data } = await supabase
      .from('knowledge_items')
      .select('title, content, category')
      .eq('is_active', true)
      .in('category', ['program_info', 'general'])
      .limit(maxResults);

    return (data || []).map(item => ({ ...item, similarity: 0.5 }));
  }

  // Search using Supabase text search
  const searchTerms = keywords.join(' | ');
  let queryBuilder = supabase
    .from('knowledge_items')
    .select('title, content, category')
    .eq('is_active', true)
    .or(`title.ilike.%${keywords[0]}%,content.ilike.%${keywords[0]}%`);

  if (category) {
    queryBuilder = queryBuilder.eq('category', category);
  }

  const { data } = await queryBuilder.limit(maxResults * 2); // Fetch more, then rank

  if (!data || data.length === 0) {
    // Broader fallback — just get some relevant content
    const { data: fallback } = await supabase
      .from('knowledge_items')
      .select('title, content, category')
      .eq('is_active', true)
      .limit(maxResults);

    return (fallback || []).map(item => ({ ...item, similarity: 0.3 }));
  }

  // Rank results by keyword overlap
  const ranked = data.map(item => {
    const text = `${item.title} ${item.content}`.toLowerCase();
    const matches = keywords.filter(kw => text.includes(kw)).length;
    return { ...item, similarity: matches / keywords.length };
  });

  ranked.sort((a, b) => b.similarity - a.similarity);
  return ranked.slice(0, maxResults);
}

// --- Format knowledge for prompt injection ---
export function formatKnowledgeForPrompt(
  items: { title: string; content: string; category: string }[]
): string {
  if (items.length === 0) return '';

  return items
    .map((item, i) => `[${item.category.toUpperCase()}] ${item.title}\n${item.content}`)
    .join('\n\n---\n\n');
}
