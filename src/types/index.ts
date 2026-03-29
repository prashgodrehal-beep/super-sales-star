// === GrowthAspire AI Agent - Core Types ===

// --- Lead Qualification ---
export type LeadScore = 'hot' | 'warm' | 'nurture' | 'unscored';

export interface LeadSignals {
  role_seniority: number;      // 0-3: unknown, individual, manager, CXO/VP
  company_size: number;        // 0-3: unknown, small, mid, enterprise
  urgency: number;             // 0-3: unknown, exploring, planning, immediate
  budget_signals: number;      // 0-3: unknown, no signal, mentioned, confirmed
  ai_maturity: number;         // 0-3: unknown, beginner, intermediate, advanced
  engagement_depth: number;    // 0-3: minimal, moderate, deep, very deep
}

// --- Conversations ---
export interface Conversation {
  id: string;
  visitor_id: string;
  page_url: string;
  started_at: string;
  ended_at: string | null;
  lead_score: LeadScore;
  lead_signals: LeadSignals;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_company: string | null;
  summary: string | null;
  calendly_booked: boolean;
  status: 'active' | 'ended' | 'abandoned';
  metadata: Record<string, unknown>;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  rich_content: RichContent | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

// --- Rich Content (case studies, videos, CTAs in chat) ---
export type RichContentType = 'case_study' | 'video_link' | 'screenshot' | 'testimonial' | 'calendly_cta' | 'email_capture';

export interface RichContent {
  type: RichContentType;
  data: Record<string, unknown>;
}

export interface CaseStudyCard {
  type: 'case_study';
  data: {
    id: string;
    title: string;
    category: string;
    stat: string;
    description: string;
    industry: string;
    image_url?: string;
  };
}

export interface VideoLinkCard {
  type: 'video_link';
  data: {
    title: string;
    url: string;
    thumbnail_url?: string;
    duration?: string;
    description: string;
  };
}

// --- Knowledge Base ---
export interface KnowledgeItem {
  id: string;
  category: 'case_study' | 'faq' | 'program_info' | 'testimonial' | 'methodology' | 'pricing' | 'video' | 'general';
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

// --- Email Drafts ---
export type EmailStatus = 'pending' | 'approved' | 'sent' | 'rejected' | 'edited';
export type EmailTrigger = 'post_conversation' | 'post_booking' | 'nurture_followup';

export interface EmailDraft {
  id: string;
  conversation_id: string;
  trigger: EmailTrigger;
  to_email: string;
  to_name: string | null;
  subject: string;
  body_html: string;
  body_text: string;
  status: EmailStatus;
  edited_body_html: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
}

// --- API Types ---
export interface ChatRequest {
  conversation_id?: string;
  visitor_id: string;
  message: string;
  page_url: string;
  metadata?: Record<string, unknown>;
}

export interface ChatResponse {
  conversation_id: string;
  message: string;
  rich_content: RichContent[] | null;
  lead_score: LeadScore;
  should_show_calendly: boolean;
  should_capture_email: boolean;
}

// --- Agent Config ---
export interface AgentConfig {
  name: string;
  role: string;
  tone: string;
  greeting_home: string;
  greeting_program: string;
  calendly_url: string;
  qualification_threshold: {
    hot: number;
    warm: number;
  };
}
