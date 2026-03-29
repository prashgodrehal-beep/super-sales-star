import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Talk to Kshama - GrowthAspire AI Sales Advisor',
  description: 'Have a conversation with Kshama, your AI Sales Advisor at GrowthAspire. Get personalized insights on sales transformation.',
};

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
