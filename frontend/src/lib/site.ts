export const siteConfig = {
  name: 'Novah',
  url: 'https://novah.com/', // Placeholder URL
  description: 'Novah - Intelligent AI Solutions', // Placeholder description
  links: {
    twitter: 'https://x.com/novah', // Placeholder link
    github: 'https://github.com/novah-ai/', // Placeholder link
    linkedin: 'https://www.linkedin.com/company/novah/', // Placeholder link
  },
  paths: { // Added standard paths for consistency, assuming these exist or will be used
    home: '/',
    dashboard: '/dashboard',
    login: '/auth',
    signup: '/auth?mode=signup',
    // ... other paths
  },
  publicPaths: ['/', '/auth', '/auth/reset-password', '/legal/terms', '/legal/privacy'], // Example public paths
};

export type SiteConfig = typeof siteConfig;
