# GrowthAspire AI Agent — Deployment Guide

## Environment Variables Checklist

You need these 8 values. Collect them all, then add to Vercel.

| Variable | Where to get it | Value |
|----------|----------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | `eyJhbG...` |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | `sk-ant-...` |
| `RESEND_API_KEY` | resend.com → API Keys | `re_...` |
| `RESEND_FROM_EMAIL` | After domain verification | `kshama@growthaspire.com` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL | `https://ga-agent.vercel.app` |
| `ADMIN_EMAIL` | Your email for notifications | `prashanth@growthaspire.com` |
| `NOTIFICATION_EMAIL` | Same as admin or different | `prashanth@growthaspire.com` |

## Step 1: Supabase Database

1. Go to app.supabase.com → New Project → name: `growthaspire-agent`
2. Region: Singapore (closest to India)
3. SQL Editor → New Query → paste `scripts/schema.sql` → Run
4. Copy URL + keys from Settings → API

## Step 2: Resend Email

1. Go to resend.com → sign up
2. Domains → Add Domain → `growthaspire.com`
3. Add the DNS records they provide to your domain registrar
4. Wait for verification (usually 5-30 minutes)
5. API Keys → Create API Key
6. The from email will be: `Kshama <kshama@growthaspire.com>`

## Step 3: Deploy to Vercel

1. Push code to GitHub
2. Go to vercel.com → Import Project → select repo
3. Framework: Next.js (auto-detected)
4. Add ALL environment variables from the checklist above
5. Deploy

## Step 4: Seed Knowledge Base

After deployment, run locally with your .env.local:
```bash
npm run seed-kb
```

Or use Supabase SQL Editor to insert directly.

## Step 5: Embed on growthaspire.com

Add this to your WordPress header or the specific page:
```html
<script 
  src="https://YOUR-VERCEL-URL.vercel.app/embed.js" 
  data-mode="hero" 
  data-target="#HERO-ELEMENT-ID"
  data-agent-url="https://YOUR-VERCEL-URL.vercel.app/agent">
</script>
```

Replace:
- `YOUR-VERCEL-URL` with your actual Vercel deployment URL
- `#HERO-ELEMENT-ID` with the CSS selector for your homepage hero section
