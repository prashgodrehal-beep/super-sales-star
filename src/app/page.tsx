export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a1628] text-white flex items-center justify-center font-sans">
      <div className="text-center max-w-lg px-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-amber-400 flex items-center justify-center text-3xl font-bold text-[#0a1628] mx-auto mb-6">
          K
        </div>
        <h1 className="text-3xl font-bold mb-3">GrowthAspire AI Agent</h1>
        <p className="text-gray-400 mb-8">
          Kshama is your AI Sales Advisor. This is the backend server powering the concierge experience on growthaspire.com.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-cyan-500 text-[#0a1628] font-semibold hover:bg-cyan-400 transition"
          >
            Admin Dashboard
          </a>
          <a
            href="/api/chat"
            className="px-6 py-3 rounded-xl border border-cyan-500/30 text-cyan-400 font-semibold hover:bg-cyan-500/10 transition"
          >
            API Docs
          </a>
        </div>
        <p className="text-gray-600 text-sm mt-12">
          v1.0.0 · Powered by Claude AI
        </p>
      </div>
    </div>
  );
}
