import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Conversation | OoKoO",
  description: "Interactive agent conversation powered by OoKoO",
  openGraph: {
    title: "Agent Conversation | OoKoO",
    description: "Interactive agent conversation powered by OoKoO",
    type: "website",
  },
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}