'use client';

import { useState, useEffect } from 'react';

// Types
interface Lead {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_company: string | null;
  lead_score: string;
  started_at: string;
  calendly_booked: boolean;
  status: string;
  page_url: string;
}

interface EmailDraft {
  id: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  body_html: string;
  status: string;
  trigger_type: string;
  created_at: string;
  conversations?: {
    visitor_name: string | null;
    lead_score: string;
  };
}

interface ConversationDetail {
  conversation: Lead & { lead_signals: Record<string, number>; summary: string | null };
  messages: { id: string; role: string; content: string; created_at: string; rich_content: unknown }[];
  emails: EmailDraft[];
}

// Score badge component
function ScoreBadge({ score }: { score: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    hot: { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', label: '🔥 Hot' },
    warm: { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', label: '🟡 Warm' },
    nurture: { bg: 'bg-cyan-500/15 border-cyan-500/30', text: 'text-cyan-400', label: '🌱 Nurture' },
    unscored: { bg: 'bg-gray-500/15 border-gray-500/30', text: 'text-gray-400', label: '⬜ New' },
  };
  const s = styles[score] || styles.unscored;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
      {isActive ? 'Active' : status}
    </span>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState<'conversations' | 'emails' | 'knowledge' | 'settings'>('conversations');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [emails, setEmails] = useState<EmailDraft[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [scoreFilter, setScoreFilter] = useState('all');

  // Fetch leads
  useEffect(() => {
    if (tab === 'conversations') {
      setLoading(true);
      fetch(`/api/leads?score=${scoreFilter}`)
        .then(r => r.json())
        .then(data => setLeads(data.leads || []))
        .catch(() => setLeads([]))
        .finally(() => setLoading(false));
    }
  }, [tab, scoreFilter]);

  // Fetch emails
  useEffect(() => {
    if (tab === 'emails') {
      setLoading(true);
      fetch('/api/emails?status=all')
        .then(r => r.json())
        .then(data => setEmails(data.emails || []))
        .catch(() => setEmails([]))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  // Load conversation detail
  const loadConversation = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      setSelectedConversation(data);
    } catch {
      console.error('Failed to load conversation');
    }
    setLoading(false);
  };

  // Email actions
  const handleEmailAction = async (emailId: string, action: 'approve' | 'reject') => {
    await fetch('/api/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, email_id: emailId }),
    });
    // Refresh
    const res = await fetch('/api/emails?status=all');
    const data = await res.json();
    setEmails(data.emails || []);
  };

  return (
    <div className="text-white">
      {/* Tab navigation */}
      <div className="flex gap-2 mb-8">
        {(['conversations', 'emails', 'knowledge', 'settings'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedConversation(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'emails' && emails.filter(e => e.status === 'pending').length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-[#0a1628] text-xs font-bold">
                {emails.filter(e => e.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* CONVERSATIONS TAB */}
      {tab === 'conversations' && !selectedConversation && (
        <div>
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Conversations', value: leads.length, color: 'text-white' },
              { label: 'Hot Leads', value: leads.filter(l => l.lead_score === 'hot').length, color: 'text-red-400' },
              { label: 'Warm Leads', value: leads.filter(l => l.lead_score === 'warm').length, color: 'text-amber-400' },
              { label: 'Calendly Booked', value: leads.filter(l => l.calendly_booked).length, color: 'text-green-400' },
            ].map(stat => (
              <div key={stat.label} className="p-5 rounded-xl bg-[#101d35] border border-cyan-500/8">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {['all', 'hot', 'warm', 'nurture', 'unscored'].map(s => (
              <button
                key={s}
                onClick={() => setScoreFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  scoreFilter === s ? 'bg-cyan-500/15 text-cyan-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Conversations list */}
          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">💬</div>
              <div className="text-gray-400 text-lg mb-2">No conversations yet</div>
              <div className="text-gray-600 text-sm">When visitors talk to Kshama, their conversations will appear here.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.map(lead => (
                <button
                  key={lead.id}
                  onClick={() => loadConversation(lead.id)}
                  className="w-full text-left p-4 rounded-xl bg-[#101d35] border border-cyan-500/8 hover:border-cyan-500/25 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#162242] flex items-center justify-center text-sm font-medium text-gray-400">
                        {(lead.visitor_name || lead.visitor_email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white group-hover:text-cyan-300 transition">
                          {lead.visitor_name || lead.visitor_email || 'Anonymous Visitor'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(lead.started_at).toLocaleString()} · {lead.page_url}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {lead.calendly_booked && (
                        <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">📅 Booked</span>
                      )}
                      <ScoreBadge score={lead.lead_score} />
                      <StatusBadge status={lead.status} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONVERSATION DETAIL */}
      {tab === 'conversations' && selectedConversation && (
        <div>
          <button
            onClick={() => setSelectedConversation(null)}
            className="text-sm text-cyan-400 hover:text-cyan-300 mb-6 flex items-center gap-1"
          >
            ← Back to all conversations
          </button>

          <div className="grid grid-cols-3 gap-6">
            {/* Messages */}
            <div className="col-span-2 bg-[#101d35] rounded-xl border border-cyan-500/8 p-6 max-h-[70vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Conversation Transcript</h3>
              <div className="space-y-4">
                {selectedConversation.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-cyan-500/20 text-white rounded-br-sm'
                          : 'bg-[#162242] text-gray-300 rounded-bl-sm'
                      }`}
                    >
                      <div className="text-[10px] text-gray-500 mb-1">
                        {msg.role === 'user' ? 'Visitor' : 'Kshama'} · {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar - Lead info */}
            <div className="space-y-4">
              <div className="bg-[#101d35] rounded-xl border border-cyan-500/8 p-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Lead Info</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500">Name</div>
                    <div className="text-white">{selectedConversation.conversation.visitor_name || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="text-white">{selectedConversation.conversation.visitor_email || 'Not captured'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Company</div>
                    <div className="text-white">{selectedConversation.conversation.visitor_company || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Score</div>
                    <ScoreBadge score={selectedConversation.conversation.lead_score} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Calendly</div>
                    <div className={selectedConversation.conversation.calendly_booked ? 'text-green-400' : 'text-gray-500'}>
                      {selectedConversation.conversation.calendly_booked ? '✅ Booked' : 'Not booked'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead Signals */}
              <div className="bg-[#101d35] rounded-xl border border-cyan-500/8 p-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Qualification Signals</h3>
                <div className="space-y-2">
                  {Object.entries(selectedConversation.conversation.lead_signals || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                      <div className="flex gap-0.5">
                        {[0, 1, 2, 3].map(i => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-sm ${
                              i < (val as number) ? 'bg-cyan-400' : 'bg-[#162242]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email drafts for this conversation */}
              {selectedConversation.emails.length > 0 && (
                <div className="bg-[#101d35] rounded-xl border border-cyan-500/8 p-5">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Email Drafts</h3>
                  {selectedConversation.emails.map(email => (
                    <div key={email.id} className="mb-3 last:mb-0">
                      <div className="text-sm text-white">{email.subject}</div>
                      <div className="text-xs text-gray-500">{email.status} · {email.trigger_type}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EMAILS TAB */}
      {tab === 'emails' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Email Approval Queue</h2>
          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading...</div>
          ) : emails.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">📧</div>
              <div className="text-gray-400 text-lg mb-2">No email drafts yet</div>
              <div className="text-gray-600 text-sm">When Kshama drafts follow-up emails, they will appear here for your approval.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {emails.map(email => (
                <div
                  key={email.id}
                  className="p-5 rounded-xl bg-[#101d35] border border-cyan-500/8"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-white">{email.subject}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        To: {email.to_name || email.to_email} · {email.trigger_type.replace('_', ' ')} · {new Date(email.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      email.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                      email.status === 'sent' ? 'bg-green-500/15 text-green-400' :
                      email.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                      'bg-gray-500/15 text-gray-400'
                    }`}>
                      {email.status}
                    </span>
                  </div>

                  {/* Email preview */}
                  <div
                    className="bg-[#0a1628] rounded-lg p-4 text-sm text-gray-300 mb-4 max-h-48 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: email.body_html }}
                  />

                  {/* Actions */}
                  {(email.status === 'pending' || email.status === 'edited') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEmailAction(email.id, 'approve')}
                        className="px-4 py-2 rounded-lg bg-green-500/15 text-green-400 text-sm font-medium hover:bg-green-500/25 transition"
                      >
                        ✅ Approve & Send
                      </button>
                      <button
                        onClick={() => handleEmailAction(email.id, 'reject')}
                        className="px-4 py-2 rounded-lg bg-red-500/15 text-red-400 text-sm font-medium hover:bg-red-500/25 transition"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KNOWLEDGE BASE TAB */}
      {tab === 'knowledge' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Knowledge Base</h2>
            <button className="px-4 py-2 rounded-lg bg-cyan-500/15 text-cyan-400 text-sm font-medium hover:bg-cyan-500/25 transition">
              + Add Item
            </button>
          </div>
          <div className="bg-[#101d35] rounded-xl border border-cyan-500/8 p-6">
            <p className="text-gray-400 text-center py-8">
              Knowledge base management UI coming in Stage 5.<br />
              For now, use the seed script: <code className="text-cyan-400">npm run seed-kb</code>
            </p>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {tab === 'settings' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Agent Settings</h2>
          <div className="bg-[#101d35] rounded-xl border border-cyan-500/8 p-6">
            <p className="text-gray-400 text-center py-8">
              Agent settings management coming in Stage 5.<br />
              Agent name, tone, greetings, and qualification thresholds can be configured here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
