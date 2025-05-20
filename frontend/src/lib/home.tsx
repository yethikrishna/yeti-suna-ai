export const siteConfig = {
  name: 'Texo AI',
  description: 'The Generalist AI Agent that can act on your behalf.',
  cta: 'Start Free',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  keywords: ['AI Agent', 'Generalist AI', 'Open Source AI', 'Autonomous Agent'],
  links: {
    email: 'support@texoai.com.au',
    twitter: 'https://x.com/texoai',
    discord: 'https://discord.gg/texoai',
    github: 'https://github.com/Texo-ai/TexoAI',
    instagram: 'https://instagram.com/texoai',
  }
};

export type SiteConfig = typeof siteConfig;
