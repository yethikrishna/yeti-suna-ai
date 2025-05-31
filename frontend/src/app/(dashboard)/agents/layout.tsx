import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent Conversation | Operator by OMNI',
  description: 'Interactive agent conversation powered by Operator by OMNI',
  openGraph: {
    title: 'Agent Conversation | Operator by OMNI',
    description: 'Interactive agent conversation powered by Operator by OMNI',
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
