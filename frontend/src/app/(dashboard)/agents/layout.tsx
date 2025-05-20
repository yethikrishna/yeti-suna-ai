import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent Conversation | Texo AI',
  description: 'Interactive agent conversation powered by Texo AI',
  openGraph: {
    title: 'Agent Conversation | Texo AI',
    description: 'Interactive agent conversation powered by Texo AI',
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
