// === Seed Knowledge Base ===
// Run with: npx tsx scripts/seed-knowledge-base.ts
// Pre-loads Kshama's brain with GrowthAspire content

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KNOWLEDGE_ITEMS = [
  // --- PROGRAM INFO ---
  {
    category: 'program_info',
    title: 'AI Builders Revolution Program Overview',
    content: `The AI Builders Revolution is GrowthAspire's flagship program for business leaders who want to understand and leverage AI in their sales operations. It goes beyond theory — participants learn to identify where AI fits in their specific sales process, build AI-augmented workflows, and create measurable competitive advantages. The program is designed for founders, CXOs, and senior sales leaders who want to lead the AI transformation in their organizations rather than be disrupted by it. It combines Prashanth Krishna's 25+ years of sales transformation expertise with cutting-edge AI implementation strategies.`,
    metadata: { priority: 'high', page: 'online-programs' },
  },
  {
    category: 'program_info',
    title: 'GrowthAspire 90-Day Transformation Methodology',
    content: `GrowthAspire's proprietary 5-stage methodology transforms sales teams in 90 days:
Stage 1 - Diagnosis (Days 1-10): Free consultation, team assessment, call reviews to understand current state.
Stage 2 - Insights (Days 11-20): Detailed findings, customized strategy development based on diagnosis.
Stage 3 - Goals (Days 21-30): Clear objectives, success metrics, team alignment on transformation targets.
Stage 4 - Training (Days 31-60): Customized skill development, practical frameworks, role-plays with real scenarios.
Stage 5 - Sustenance (Days 61-90): Individual coaching, implementation support, accountability frameworks.
Many clients start seeing momentum in 30-45 days with quick wins in discovery calls, objection handling, and lead qualification.`,
    metadata: { priority: 'high' },
  },
  {
    category: 'program_info',
    title: 'GrowthAspire Core Training Programs',
    content: `GrowthAspire offers comprehensive sales transformation services:
1. Consultative Selling - Master needs-based selling, understand customer pain points, build trust and offer tailored solutions.
2. Key Account Management (KAM) - Grow strategic accounts systematically, deepen relationships, increase wallet share.
3. Sales Negotiation Skills - Win-win deal closing strategies, handle objections, protect margins while building partnerships.
4. Inside Sales Training - Remote selling mastery, phone and video selling techniques, digital engagement skills.
5. Selling with Insights - Data-driven selling, use market and customer insights to create compelling business cases.
6. Sales Executive Coaching - 1:1 coaching for senior sales leaders, personalized development plans.
7. Ethical Persuasion - Cialdini-certified influence principles applied to business contexts.
8. Leadership Transformation - Execution-focused leadership development for sales leaders.`,
    metadata: { priority: 'medium' },
  },

  // --- CASE STUDIES ---
  {
    category: 'case_study',
    title: 'Robotics Firm Accelerated Deal Closure',
    content: `A leading robotics and automation company was struggling with extended sales cycles that were draining team morale and revenue. After implementing GrowthAspire's sales transformation methodology, they achieved a 50% reduction in their sales cycle. Key interventions included restructuring their discovery process, implementing a consultative selling framework, and coaching the team on value-based positioning rather than feature-based pitching. The transformation happened within 90 days of the program engagement.`,
    metadata: { industry: 'Manufacturing', result: '50% faster sales cycle', category_label: 'Faster Closures' },
  },
  {
    category: 'case_study',
    title: 'Machine Tool Giant Doubled Meeting Rates',
    content: `A major machine tool manufacturer was facing challenges in getting meetings with decision-makers at target accounts. Their outreach was generic and not resonating with C-suite buyers. GrowthAspire implemented precision prospecting techniques — teaching the team to research accounts deeply, identify pain points specific to each prospect, and craft insight-led outreach messages. The result: meeting rates doubled within 60 days. The team went from struggling to fill their pipeline to having a consistent flow of qualified meetings with the right buyers.`,
    metadata: { industry: 'Industrial Engineering', result: '2x meeting rate', category_label: 'More Meetings' },
  },
  {
    category: 'case_study',
    title: 'Real Estate Agency Hit Best-Ever Quarter',
    content: `A mid-sized real estate agency was in a sales slump — underperforming targets for three consecutive quarters. The sales team was demotivated and using outdated techniques. GrowthAspire's intervention focused on mindset transformation first, then skill-building in consultative selling and objection handling specific to real estate buyers. The combination of psychological frameworks (using Cialdini's principles of social proof and commitment/consistency) with practical sales techniques led to their best quarter in company history.`,
    metadata: { industry: 'Real Estate', result: 'Best quarter ever', category_label: 'Record Sales' },
  },
  {
    category: 'case_study',
    title: 'Logistics Leader Scaled Strategic Accounts Using KAM',
    content: `A logistics company with a strong client base was struggling to grow revenue from existing key accounts. They were transactional in their approach and missing expansion opportunities. GrowthAspire implemented a Key Account Management (KAM) framework that helped account managers map stakeholder ecosystems, identify growth opportunities within accounts, and build multi-threaded relationships. The result was significant growth in strategic account revenue and improved client retention.`,
    metadata: { industry: 'Logistics', result: 'Scaled strategic accounts', category_label: 'Key Account Growth' },
  },

  // --- TESTIMONIALS ---
  {
    category: 'testimonial',
    title: 'Dinesh Singh - Zebra Technologies',
    content: `"Genuinely one of the best workshops/Training I've attended so far with respect to KAM. It was interactive, directional and easily adaptable. I really enjoyed the whole session." — Dinesh Singh, Territory Account Manager, Zebra Technologies`,
    metadata: { company: 'Zebra Technologies', role: 'Territory Account Manager' },
  },
  {
    category: 'testimonial',
    title: 'Ajay Mishra - Zebra Technologies',
    content: `"Interactive, exchange of ideas, reinforcing certain facts and well-structured content. Also, a follow-up plan, as well as support in real life cases, is appreciable." — Ajay Mishra, Head North & East India, Bangladesh, Zebra Technologies`,
    metadata: { company: 'Zebra Technologies', role: 'Head North & East India' },
  },

  // --- FAQs ---
  {
    category: 'faq',
    title: 'Will this work for our industry?',
    content: `Sales transformation isn't about one-size-fits-all tactics. GrowthAspire first deep-dives into your sales process, industry dynamics, and team strengths. Then strategies are tailored to align with your buyer's journey. Clients span real estate, IT, manufacturing, pharmaceuticals, financial services, and more — proving the framework is universal but execution is custom. Over 22 industries served.`,
    metadata: {},
  },
  {
    category: 'faq',
    title: 'How do we measure ROI?',
    content: `Every initiative is tied to clear, measurable outcomes — lead-to-opportunity conversion, win rate improvement, deal size increase, or sales cycle reduction. Baseline metrics are established before starting and progress is tracked throughout the engagement. What gets measured, gets improved.`,
    metadata: {},
  },
  {
    category: 'faq',
    title: 'What if the team resists change?',
    content: `This is a common concern. GrowthAspire programs include real-world implementation workshops, not just training. Each change is demonstrated to directly impact results, so the team sees the "why" behind the change. Most importantly, the sales team is involved early as co-creators of the transformation — not passive participants.`,
    metadata: {},
  },
  {
    category: 'faq',
    title: 'How fast can we see results?',
    content: `Many clients start seeing momentum in 30-45 days — not months. While long-term change takes structure, the focus is on quick wins from Day 1: improving discovery calls, objection handling, and lead qualification. This builds belief, energy, and fast ROI.`,
    metadata: {},
  },
  {
    category: 'faq',
    title: 'What makes this different from typical training?',
    content: `GrowthAspire delivers a sales system, not just skill-building. The method includes post-program implementation support, weekly check-ins, coaching, and accountability frameworks. This ensures the transformation sticks, not fades. Unlike typical training companies, GrowthAspire takes ownership of results and works as a sales growth partner.`,
    metadata: {},
  },

  // --- PRICING ---
  {
    category: 'pricing',
    title: 'GrowthAspire Engagement Pricing',
    content: `GrowthAspire programs are customized based on team size, program depth, duration, and specific needs. Most transformation engagements fall in the ₹1-5 lakh range. The exact investment depends on: number of participants, depth of diagnosis needed, duration of coaching and sustenance support, and whether it includes follow-up implementation support. The best way to get a precise proposal is through a conversation with Prashanth where he can understand the specific situation and recommend the right approach.`,
    metadata: { priority: 'medium' },
  },

  // --- CREDENTIALS ---
  {
    category: 'general',
    title: 'GrowthAspire Credentials and Track Record',
    content: `GrowthAspire credentials: Only Cialdini Institute Gold Partner in India. Prashanth Krishna, founder, has 25+ years of sales experience and 10+ years of training expertise. Track record: 100+ companies across 22 industries, 10,000+ professionals trained, measurable ROI for every client. Google rating: 4.5 stars with 120+ reviews. Key industries served include: Real Estate, Financial Services, Industrial Engineering, IT & ITES, Pharmaceuticals, FMCG, Channel Management, Hospitality/Travel/Leisure, Logistics, and Education. Notable clients include Zebra Technologies, Mahindra Aerospace, Lam Research, Brady Corporation, Yellow.ai, Flipkart, and others.`,
    metadata: { priority: 'high' },
  },
  {
    category: 'general',
    title: 'About Prashanth Krishna - Founder',
    content: `Prashanth Krishna is the founder of GrowthAspire and India's only Cialdini Institute Gold Partner. With 25+ years in B2B sales and 10+ years in sales training and transformation, he brings deep expertise in consultative selling, key account management, sales negotiation, and ethical persuasion. He is also the author of "Decoding Decision Science" and "The Power of We". His approach combines Cialdini's science of persuasion with practical sales frameworks to deliver measurable business results. He works directly with CXOs, founders, and senior sales leaders.`,
    metadata: { priority: 'high' },
  },
];

async function seed() {
  console.log('🧠 Seeding Kshama\'s knowledge base...\n');

  // Clear existing items
  const { error: deleteError } = await supabase
    .from('knowledge_items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.error('Failed to clear existing items:', deleteError);
  }

  // Insert new items
  let success = 0;
  for (const item of KNOWLEDGE_ITEMS) {
    const { error } = await supabase.from('knowledge_items').insert(item);
    if (error) {
      console.error(`❌ Failed: ${item.title}`, error.message);
    } else {
      console.log(`✅ Added: [${item.category}] ${item.title}`);
      success++;
    }
  }

  console.log(`\n🎉 Done! ${success}/${KNOWLEDGE_ITEMS.length} items seeded successfully.`);
  console.log('Kshama is ready to sell.\n');
}

seed().catch(console.error);
