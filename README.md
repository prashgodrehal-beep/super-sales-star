# GrowthAspire AI Agent — Kshama

An AI-powered sales concierge that lives on growthaspire.com. Kshama engages visitors in consultative conversations, qualifies leads, surfaces contextual proof points, and books discovery calls with Prashanth.

## Architecture Overview

```
[Visitor on growthaspire.com]
        ↓
[Concierge Widget (React)] ←→ [Next.js API (/api/chat)]
                                        ↓
                               [Conversation Engine]
                                   ↓           ↓
                          [RAG Pipeline]   [Lead Scoring]
                              ↓                 ↓
                    [Knowledge Base]    [Claude AI (Sonnet)]
                    [Supabase pgvector]
                                        ↓
                              [Email Draft Engine]
                              [Claude AI → Approval Queue]
                                        ↓
                              [Admin Dashboard]
                              [Resend (email sending)]
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (Widget) | React/Preact (embeddable) |
| Frontend (Dashboard) | Next.js 15 + Tailwind CSS v4 |
| Backend API | Next.js API Routes |
| AI Engine | Claude Sonnet (conversations) |
| Knowledge Base / RAG | Supabase pgvector + keyword search |
| Database | Supabase (PostgreSQL) |
| Email | Resend.com |
| Hosting | Vercel |

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo>
cd growthaspire-agent
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `scripts/schema.sql`
3. Copy your project URL and keys from **Settings → API**

### 3. Set Up Resend

1. Go to [resend.com](https://resend.com) and create an account
2. Add and verify your domain (growthaspire.com)
3. Create an API key
4. Set up the sender address: `kshama@growthaspire.com`

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

### 5. Seed the Knowledge Base

```bash
npm run seed-kb
```

### 6. Run Development Server

```bash
npm run dev
```

- App: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Chat API: POST http://localhost:3000/api/chat

### 7. Deploy to Vercel

```bash
npx vercel
# Set environment variables in Vercel dashboard
```

## API Reference

### POST /api/chat
Send a visitor message and get Kshama's response.

```json
{
  "visitor_id": "unique-visitor-id",
  "message": "I want to improve my sales team",
  "page_url": "/",
  "conversation_id": "optional-existing-conversation-id"
}
```

Response:
```json
{
  "conversation_id": "uuid",
  "message": "Kshama's response text",
  "rich_content": [{"type": "case_study", "data": {...}}],
  "lead_score": "warm",
  "should_show_calendly": false,
  "should_capture_email": true
}
```

### GET /api/leads
List all conversations with lead data.

### GET /api/conversations/[id]
Get a conversation with messages and emails.

### POST /api/emails
Manage email drafts (generate, approve, reject, edit).

### GET/POST/PUT/DELETE /api/knowledge
Manage knowledge base items.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Main conversation endpoint
│   │   ├── leads/route.ts         # Lead management
│   │   ├── conversations/[id]/    # Conversation detail
│   │   ├── emails/route.ts        # Email draft management
│   │   └── knowledge/route.ts     # Knowledge base CRUD
│   ├── dashboard/
│   │   ├── layout.tsx             # Dashboard shell
│   │   └── page.tsx               # Main dashboard UI
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── supabase.ts                # Database client
│   ├── conversation-engine.ts     # Core AI logic
│   ├── prompts.ts                 # Kshama's persona & system prompt
│   ├── rag.ts                     # Knowledge retrieval pipeline
│   └── email-engine.ts            # Email drafting & sending
├── types/
│   └── index.ts                   # TypeScript definitions
scripts/
├── schema.sql                     # Supabase database schema
└── seed-knowledge-base.ts         # Knowledge base seeder
```

## Embedding on growthaspire.com

The concierge widget connects to this backend via the `/api/chat` endpoint. 
Widget embedding instructions will be provided in Stage 3.

---

Built with ❤️ for GrowthAspire by Kshama's engineering team.
