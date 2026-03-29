-- =====================================================
-- GrowthAspire AI Agent - Database Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable pgvector extension for RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CONVERSATIONS
-- =====================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  page_url TEXT NOT NULL DEFAULT '/',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  lead_score TEXT NOT NULL DEFAULT 'unscored' CHECK (lead_score IN ('hot', 'warm', 'nurture', 'unscored')),
  lead_signals JSONB NOT NULL DEFAULT '{
    "role_seniority": 0,
    "company_size": 0,
    "urgency": 0,
    "budget_signals": 0,
    "ai_maturity": 0,
    "engagement_depth": 0
  }'::jsonb,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_company TEXT,
  summary TEXT,
  calendly_booked BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'abandoned')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_visitor_id ON conversations(visitor_id);
CREATE INDEX idx_conversations_lead_score ON conversations(lead_score);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_started_at ON conversations(started_at DESC);

-- =====================================================
-- 2. MESSAGES
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  rich_content JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- =====================================================
-- 3. KNOWLEDGE BASE (with vector embeddings for RAG)
-- =====================================================
CREATE TABLE knowledge_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN (
    'case_study', 'faq', 'program_info', 'testimonial',
    'methodology', 'pricing', 'video', 'general'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding VECTOR(1024),  -- Voyage AI or OpenAI embedding dimension
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_category ON knowledge_items(category);
CREATE INDEX idx_knowledge_active ON knowledge_items(is_active);

-- Vector similarity search index (IVFFlat for performance)
CREATE INDEX idx_knowledge_embedding ON knowledge_items
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- =====================================================
-- 4. EMAIL DRAFTS
-- =====================================================
CREATE TABLE email_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'post_conversation', 'post_booking', 'nurture_followup'
  )),
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'sent', 'rejected', 'edited'
  )),
  edited_body_html TEXT,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emails_status ON email_drafts(status);
CREATE INDEX idx_emails_conversation ON email_drafts(conversation_id);
CREATE INDEX idx_emails_created ON email_drafts(created_at DESC);

-- =====================================================
-- 5. AGENT SETTINGS
-- =====================================================
CREATE TABLE agent_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default agent settings
INSERT INTO agent_settings (key, value) VALUES
  ('agent_name', '"Kshama"'),
  ('agent_role', '"AI Sales Advisor at GrowthAspire"'),
  ('agent_tone', '"Subtle, consultative, never pushy. Like a knowledgeable advisor who understands your situation."'),
  ('greeting_home', '"Most business leaders I speak with are figuring out where AI fits — without the hype. What brings you to GrowthAspire today?"'),
  ('greeting_program', '"The AI Builders Revolution is one of our most popular programs. Are you exploring how AI can transform your sales process, or do you have a specific challenge in mind?"'),
  ('calendly_url', '"https://calendly.com/prashanth-growthaspire/30min"'),
  ('qualification_thresholds', '{"hot": 12, "warm": 7}');

-- =====================================================
-- 6. VISITOR SESSIONS (for returning visitor recognition)
-- =====================================================
CREATE TABLE visitor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  company TEXT,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_conversations INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX idx_visitor_sessions_visitor_id ON visitor_sessions(visitor_id);
CREATE INDEX idx_visitor_sessions_email ON visitor_sessions(email);

-- =====================================================
-- 7. NOTIFICATION LOG
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('booking', 'hot_lead', 'email_pending')),
  conversation_id UUID REFERENCES conversations(id),
  email_draft_id UUID REFERENCES email_drafts(id),
  sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- =====================================================
-- AUTO-UPDATE TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_conversations_updated
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_knowledge_updated
  BEFORE UPDATE ON knowledge_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_settings_updated
  BEFORE UPDATE ON agent_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- VECTOR SEARCH FUNCTION (used by RAG pipeline)
-- =====================================================
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding VECTOR(1024),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5,
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ki.id,
    ki.category,
    ki.title,
    ki.content,
    ki.metadata,
    1 - (ki.embedding <=> query_embedding) AS similarity
  FROM knowledge_items ki
  WHERE ki.is_active = TRUE
    AND (filter_category IS NULL OR ki.category = filter_category)
    AND 1 - (ki.embedding <=> query_embedding) > match_threshold
  ORDER BY ki.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- For now, we use service role key for all backend operations.
-- RLS policies will be added when we build multi-tenant auth.

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for backend API)
CREATE POLICY "Service role full access" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON knowledge_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON email_drafts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON agent_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON visitor_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- DONE! Your database is ready.
-- =====================================================
