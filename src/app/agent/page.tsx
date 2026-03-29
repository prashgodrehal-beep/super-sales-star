'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================
// CONFIG — Change these for deployment
// ============================================================
const CONFIG = {
  apiUrl: typeof window !== 'undefined'
    ? ((window as unknown as Record<string, unknown>).__KSHAMA_API_URL as string) || ''
    : '',
  calendlyUrl: 'https://calendly.com/prashanth-growthaspire/30min',
  agentName: 'Kshama',
  agentRole: 'AI Sales Advisor',
};

// ============================================================
// TYPES
// ============================================================
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  richContent?: RichContentItem[];
  timestamp: Date;
}

interface RichContentItem {
  type: 'case_study' | 'video_link' | 'testimonial' | 'calendly_cta' | 'email_capture';
  data: Record<string, string>;
}

interface ChatApiResponse {
  conversation_id: string;
  message: string;
  rich_content: RichContentItem[] | null;
  lead_score: string;
  should_show_calendly: boolean;
  should_capture_email: boolean;
}

// ============================================================
// COLORS — GrowthAspire brand
// ============================================================
const C = {
  navy: '#0a1628',
  navyLight: '#101d35',
  navyMid: '#162242',
  cyan: '#00d4ff',
  cyanDim: 'rgba(0,212,255,0.12)',
  amber: '#f5a623',
  amberDim: 'rgba(245,166,35,0.12)',
  white: '#f0f4f8',
  whiteDim: 'rgba(240,244,248,0.7)',
  gray: '#7a8ba0',
  green: '#4ade80',
};

// ============================================================
// VISITOR ID (persisted in localStorage)
// ============================================================
function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('ga_visitor_id');
  if (!id) {
    id = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('ga_visitor_id', id);
  }
  return id;
}

// ============================================================
// QUICK STARTER BUTTONS
// ============================================================
const STARTERS = [
  { icon: '🚀', label: 'I want to accelerate my sales results', tag: 'accelerate' },
  { icon: '🤖', label: 'How can AI transform my sales team?', tag: 'ai' },
  { icon: '📊', label: 'Show me proof — client results', tag: 'results' },
  { icon: '💬', label: 'I have a specific challenge to discuss', tag: 'challenge' },
];

// ============================================================
// SUBCOMPONENTS
// ============================================================

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
      <AgentAvatar size={34} />
      <div style={{
        display: 'flex', gap: 4, padding: '10px 16px',
        background: C.navyMid, borderRadius: '16px 16px 16px 4px',
        border: `1px solid rgba(0,212,255,0.08)`,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: C.cyan,
            animation: `kshamaBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

function AgentAvatar({ size = 36 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${C.cyan}, ${C.amber})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, color: C.navy,
    }}>
      K
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start', gap: 10, marginBottom: 8,
      animation: 'kshamaFadeUp 0.35s ease',
    }}>
      {!isUser && <AgentAvatar size={34} />}
      <div style={{
        maxWidth: '80%', padding: '11px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser
          ? `linear-gradient(135deg, ${C.cyan}, rgba(0,180,220,0.9))`
          : C.navyMid,
        color: isUser ? C.navy : C.white,
        fontSize: 14.5, lineHeight: 1.6, fontWeight: isUser ? 500 : 400,
        border: isUser ? 'none' : `1px solid rgba(0,212,255,0.08)`,
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
    </div>
  );
}

function CaseStudyCards({ items, onSelect }: { items: RichContentItem[]; onSelect: (item: RichContentItem) => void }) {
  const cases = items.filter(i => i.type === 'case_study');
  if (cases.length === 0) return null;
  return (
    <div style={{
      display: 'flex', gap: 10, overflowX: 'auto', padding: '8px 0 8px 44px',
      animation: 'kshamaFadeUp 0.4s ease',
    }}>
      {cases.map((c, i) => (
        <div key={i} onClick={() => onSelect(c)} style={{
          minWidth: 240, padding: '16px 18px', borderRadius: 14, cursor: 'pointer',
          background: C.navyMid, border: `1px solid rgba(0,212,255,0.1)`,
          transition: 'all 0.25s', flexShrink: 0,
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = C.cyan;
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,255,0.1)';
            (e.currentTarget as HTMLDivElement).style.transform = 'none';
          }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1.1, color: C.amber, marginBottom: 6 }}>
            {c.data.category}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: C.white, lineHeight: 1.4, marginBottom: 8 }}>
            {c.data.title}
          </div>
          {c.data.stat && (
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 16, background: C.cyanDim, color: C.cyan, fontSize: 12, fontWeight: 600 }}>
              {c.data.stat}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function CalendlyCTA() {
  return (
    <div style={{
      margin: '10px 0 10px 44px', padding: 22, borderRadius: 16, textAlign: 'center' as const,
      background: `linear-gradient(135deg, rgba(0,212,255,0.07), rgba(245,166,35,0.05))`,
      border: `1px solid rgba(0,212,255,0.18)`, animation: 'kshamaFadeUp 0.4s ease',
    }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.white, marginBottom: 6 }}>
        📅 Book a Strategy Call with Prashanth
      </div>
      <div style={{ fontSize: 13, color: C.whiteDim, marginBottom: 14, lineHeight: 1.5 }}>
        30 minutes focused on your specific challenges. He'll come prepared.
      </div>
      <button
        onClick={() => window.open(CONFIG.calendlyUrl, '_blank')}
        style={{
          padding: '11px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg, ${C.cyan}, #00b4dc)`, color: C.navy,
          fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit',
          boxShadow: `0 4px 20px rgba(0,212,255,0.25)`, transition: 'transform 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
      >
        Pick a Time →
      </button>
    </div>
  );
}

function EmailCapture({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <div style={{
      margin: '10px 0 10px 44px', padding: 18, borderRadius: 14,
      background: C.navyMid, border: `1px solid ${C.amberDim}`,
      animation: 'kshamaFadeUp 0.4s ease',
    }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.amber, marginBottom: 5 }}>
        📬 Want relevant resources sent to you?
      </div>
      <div style={{ fontSize: 12.5, color: C.whiteDim, marginBottom: 10 }}>
        I'll curate case studies and insights based on what we discussed.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="email" value={val} onChange={e => setVal(e.target.value)}
          placeholder="your@email.com"
          onKeyDown={e => e.key === 'Enter' && val.includes('@') && onSubmit(val)}
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13.5,
            border: `1px solid rgba(0,212,255,0.15)`, background: 'rgba(0,0,0,0.2)',
            color: C.white, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={() => val.includes('@') && onSubmit(val)}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: C.amber, color: C.navy, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN CONCIERGE COMPONENT
// ============================================================
export default function KshamaConcierge() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [leadScore, setLeadScore] = useState('unscored');
  const [showCalendly, setShowCalendly] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [started, setStarted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pendingRichContent, setPendingRichContent] = useState<RichContentItem[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => setMounted(true), 150); }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, showCalendly, showEmailCapture, pendingRichContent]);

  // --- Send message to backend ---
  const sendToAPI = useCallback(async (text: string) => {
    setIsTyping(true);
    try {
      const res = await fetch(`${CONFIG.apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_id: getVisitorId(),
          message: text,
          conversation_id: conversationId,
          page_url: typeof window !== 'undefined' ? window.location.pathname : '/',
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data: ChatApiResponse = await res.json();

      // Store conversation ID for session continuity
      if (data.conversation_id) setConversationId(data.conversation_id);

      // Add assistant message
      const agentMsg: Message = {
        id: 'a_' + Date.now(),
        role: 'assistant',
        content: data.message,
        richContent: data.rich_content || undefined,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMsg]);

      // Handle rich content
      if (data.rich_content && data.rich_content.length > 0) {
        const cases = data.rich_content.filter(r => r.type === 'case_study');
        if (cases.length > 0) setPendingRichContent(cases);
        if (data.rich_content.some(r => r.type === 'calendly_cta')) setShowCalendly(true);
        if (data.rich_content.some(r => r.type === 'email_capture')) setShowEmailCapture(true);
      }

      // Update lead score
      if (data.lead_score) setLeadScore(data.lead_score);
      if (data.should_show_calendly) setShowCalendly(true);
      if (data.should_capture_email && !emailCaptured) setShowEmailCapture(true);

    } catch (err) {
      console.error('Chat API error:', err);
      setMessages(prev => [...prev, {
        id: 'err_' + Date.now(), role: 'assistant',
        content: "I'm having a brief moment — could you try again? If the issue persists, you can reach Prashanth directly at prashanth@growthaspire.com.",
        timestamp: new Date(),
      }]);
    }
    setIsTyping(false);
  }, [conversationId, emailCaptured]);

  // --- Handle send ---
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isTyping) return;
    setStarted(true);
    setInput('');
    setPendingRichContent([]);

    const userMsg: Message = {
      id: 'u_' + Date.now(), role: 'user', content: text, timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    sendToAPI(text);
  }, [input, isTyping, sendToAPI]);

  // --- Handle quick start ---
  const handleStarter = useCallback((label: string) => {
    setStarted(true);
    setPendingRichContent([]);
    const userMsg: Message = {
      id: 'u_' + Date.now(), role: 'user', content: label, timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    sendToAPI(label);
  }, [sendToAPI]);

  // --- Handle case study click ---
  const handleCaseSelect = useCallback((item: RichContentItem) => {
    setPendingRichContent([]);
    const text = `Tell me more about: ${item.data.title}`;
    const userMsg: Message = {
      id: 'u_' + Date.now(), role: 'user', content: text, timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    sendToAPI(text);
  }, [sendToAPI]);

  // --- Handle email capture ---
  const handleEmailSubmit = useCallback((email: string) => {
    setEmailCaptured(true);
    setShowEmailCapture(false);
    sendToAPI(`My email is ${email}`);
  }, [sendToAPI]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 20% 0%, ${C.navyLight} 0%, ${C.navy} 70%)`,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, -apple-system, sans-serif",
      color: C.white, position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      {/* Fonts + Animations */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes kshamaBounce { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-5px);opacity:1} }
        @keyframes kshamaFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes kshamaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes kshamaPulse { 0%,100%{box-shadow:0 0 16px rgba(0,212,255,0.12)} 50%{box-shadow:0 0 32px rgba(0,212,255,0.25)} }
        .kshama-input::placeholder { color: ${C.gray}; }
        .kshama-scroll::-webkit-scrollbar { width: 3px; }
        .kshama-scroll::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.15); border-radius: 3px; }
        .kshama-scroll::-webkit-scrollbar-track { background: transparent; }
        .kshama-starter:hover { border-color: ${C.cyan} !important; background: rgba(0,212,255,0.06) !important; transform: translateY(-1px) !important; }
      `}</style>

      {/* Ambient BG */}
      <div style={{ position: 'absolute', top: -200, right: -150, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, rgba(0,212,255,0.035) 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 350, height: 350, borderRadius: '50%', background: `radial-gradient(circle, rgba(245,166,35,0.025) 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* HEADER */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', background: 'rgba(10,22,40,0.88)',
        backdropFilter: 'blur(20px)', borderBottom: `1px solid rgba(0,212,255,0.06)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: `linear-gradient(135deg, ${C.cyan}, ${C.amber})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, color: C.navy,
          }}>G</div>
          <span style={{ fontWeight: 600, fontSize: 15.5, letterSpacing: -0.3 }}>GrowthAspire</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12.5, color: C.gray, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
            Online
          </span>
          <a
            href="#browse"
            onClick={e => { e.preventDefault(); document.getElementById('ga-browse')?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{
              fontSize: 12.5, color: C.cyan, textDecoration: 'none',
              padding: '5px 12px', borderRadius: 16, border: `1px solid rgba(0,212,255,0.25)`,
            }}
          >
            Browse website ↓
          </a>
        </div>
      </header>

      {/* MAIN CONCIERGE AREA */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        maxWidth: 760, width: '100%', margin: '0 auto', padding: '0 16px',
        minHeight: 'calc(100vh - 56px)',
      }}>
        {/* Agent Identity */}
        <div style={{
          textAlign: 'center', paddingTop: 32, paddingBottom: 12,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 14px',
            background: `linear-gradient(135deg, ${C.cyan}, ${C.amber})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: C.navy,
            animation: 'kshamaFloat 4s ease-in-out infinite',
            boxShadow: `0 6px 28px rgba(0,212,255,0.18)`,
          }}>K</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 3 }}>
            Hi, I'm {CONFIG.agentName}
          </div>
          <div style={{ fontSize: 13.5, color: C.gray }}>
            {CONFIG.agentRole} at GrowthAspire
          </div>
        </div>

        {/* WELCOME STATE (before conversation starts) */}
        {!started && (
          <div style={{
            opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.25s',
          }}>
            <div style={{ textAlign: 'center', padding: '16px 20px 28px', maxWidth: 560, margin: '0 auto' }}>
              <h1 style={{
                fontSize: 26, fontWeight: 700, lineHeight: 1.3, margin: '0 0 10px',
                background: `linear-gradient(135deg, ${C.white}, ${C.cyan})`,
                backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Most business leaders I speak with are figuring out where AI fits — without the hype.
              </h1>
              <p style={{ fontSize: 15, color: C.whiteDim, lineHeight: 1.6, margin: 0 }}>
                I can help you explore what's possible for your sales team in about 3 minutes.
              </p>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 9, padding: '0 6px 20px', maxWidth: 540, margin: '0 auto',
            }}>
              {STARTERS.map((s, i) => (
                <button
                  key={s.tag}
                  className="kshama-starter"
                  onClick={() => handleStarter(s.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '12px 15px', borderRadius: 11,
                    border: `1px solid rgba(0,212,255,0.12)`, background: C.navyMid,
                    color: C.white, fontSize: 13.5, fontWeight: 500,
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    transition: 'all 0.25s', animation: `kshamaFadeUp 0.45s ease ${0.4 + i * 0.08}s both`,
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CHAT AREA */}
        {started && (
          <div
            ref={chatRef}
            className="kshama-scroll"
            style={{
              flex: 1, overflowY: 'auto', padding: '6px 2px 14px',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Rich content: Case study cards */}
            {pendingRichContent.length > 0 && (
              <CaseStudyCards items={pendingRichContent} onSelect={handleCaseSelect} />
            )}

            {/* Calendly CTA */}
            {showCalendly && <CalendlyCTA />}

            {/* Email capture */}
            {showEmailCapture && !emailCaptured && (
              <EmailCapture onSubmit={handleEmailSubmit} />
            )}

            {/* Typing indicator */}
            {isTyping && <TypingDots />}
          </div>
        )}

        {/* INPUT BAR */}
        <div style={{
          padding: '14px 2px 20px', position: 'sticky', bottom: 0,
          background: `linear-gradient(transparent, ${C.navy} 25%)`, paddingTop: 28,
        }}>
          <div style={{
            display: 'flex', gap: 8, padding: '8px 8px 8px 16px',
            borderRadius: 14, border: `1px solid rgba(0,212,255,0.18)`,
            background: 'rgba(16,29,53,0.92)', backdropFilter: 'blur(10px)',
            animation: started ? 'none' : 'kshamaPulse 3s infinite',
          }}>
            <input
              ref={inputRef}
              className="kshama-input"
              type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              disabled={isTyping}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                color: C.white, fontSize: 14.5, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              style={{
                width: 40, height: 40, borderRadius: 10, border: 'none',
                background: input.trim() && !isTyping
                  ? `linear-gradient(135deg, ${C.cyan}, #00b4dc)`
                  : 'rgba(0,212,255,0.08)',
                color: input.trim() && !isTyping ? C.navy : C.gray,
                fontSize: 17, cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', fontFamily: 'inherit',
              }}
            >
              ↑
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: 10.5, color: 'rgba(122,139,160,0.4)', marginTop: 8 }}>
            Powered by GrowthAspire AI
          </div>
        </div>
      </div>

      {/* BROWSE SECTION (below the fold) */}
      <section id="ga-browse" style={{
        minHeight: '50vh', padding: '70px 20px', textAlign: 'center',
        borderTop: `1px solid rgba(0,212,255,0.06)`,
        background: `linear-gradient(180deg, ${C.navy}, ${C.navyLight})`,
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 2, color: C.cyan, marginBottom: 14 }}>
            Prefer to explore on your own?
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.3, margin: '0 0 14px' }}>
            Transform Your Sales Team Into Market Leaders in 90 Days
          </h2>
          <p style={{ fontSize: 16, color: C.whiteDim, lineHeight: 1.7, margin: '0 0 36px' }}>
            Science-backed sales training that reduces sales cycles by 50% and increases win rates by 25%+ for mid-sized companies.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 40, flexWrap: 'wrap' }}>
            {[
              { val: '100+', label: 'Companies' },
              { val: '10,000+', label: 'Professionals' },
              { val: '22', label: 'Industries' },
              { val: '4.5★', label: 'Rating' },
            ].map(s => (
              <div key={s.label}>
                <div style={{
                  fontSize: 28, fontWeight: 800,
                  background: `linear-gradient(135deg, ${C.cyan}, ${C.amber})`,
                  backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{s.val}</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 40 }}>
            {[
              { icon: '🎯', t: 'Consultative Selling' },
              { icon: '🏢', t: 'Key Account Management' },
              { icon: '🤝', t: 'Sales Negotiation' },
              { icon: '📞', t: 'Inside Sales' },
              { icon: '🧠', t: 'Ethical Persuasion' },
              { icon: '🚀', t: 'AI-Powered Sales' },
            ].map(s => (
              <div key={s.t} style={{
                padding: 20, borderRadius: 12, background: C.navyMid,
                border: `1px solid rgba(0,212,255,0.06)`, textAlign: 'left',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.t}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              padding: '14px 36px', borderRadius: 11, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${C.cyan}, #00b4dc)`, color: C.navy,
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              boxShadow: `0 4px 20px rgba(0,212,255,0.25)`,
            }}
          >
            ↑ Talk to {CONFIG.agentName} Instead
          </button>
        </div>
      </section>
    </div>
  );
}
