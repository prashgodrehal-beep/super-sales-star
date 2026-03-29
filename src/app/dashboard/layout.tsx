import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kshama Dashboard - GrowthAspire',
  description: 'Manage conversations, leads, and emails.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-[#0a1628]/90 backdrop-blur-xl border-b border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-amber-400 flex items-center justify-center text-sm font-bold text-[#0a1628]">
              K
            </div>
            <span className="text-white font-semibold text-lg">Kshama Dashboard</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
              Conversations
            </a>
            <a href="/dashboard?tab=emails" className="text-sm text-gray-400 hover:text-white transition">
              Emails
            </a>
            <a href="/dashboard?tab=knowledge" className="text-sm text-gray-400 hover:text-white transition">
              Knowledge Base
            </a>
            <a href="/dashboard?tab=settings" className="text-sm text-gray-400 hover:text-white transition">
              Settings
            </a>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
