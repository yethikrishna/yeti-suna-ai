import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Agent | Operator by OMNI',
  description: 'Interactive agent playground powered by Operator by OMNI',
  openGraph: {
    title: 'Agent Playground | Operator by OMNI',
    description: 'Interactive agent playground powered by Operator by OMNI',
    type: 'website',
  },
};

export default function NewAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
