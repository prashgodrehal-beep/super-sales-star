import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Talk to Kshama (Classic) - GrowthAspire',
  description: 'Classic version of Kshama for A/B testing.',
};

export default function ClassicAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
