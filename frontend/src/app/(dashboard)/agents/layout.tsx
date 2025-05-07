import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent Conversation | PIA',
  description: 'Interactive agent conversation powered by PIA',
  openGraph: {
    title: 'Agent Conversation | PIA',
    description: 'Interactive agent conversation powered by PIA',
    type: 'website',
  },
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
