import { createBrowserClient } from '@supabase/ssr';

const MOCK_ACCESS_TOKEN = 'mock-access-token-for-static-export-' + Date.now();

export const createClient = () => {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Ensure the URL is in the proper format with http/https protocol
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    // If it's just a hostname without protocol, add http://
    supabaseUrl = `http://${supabaseUrl}`;
  }

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  
  if (typeof window !== 'undefined') {
    const mockSession = {
      access_token: MOCK_ACCESS_TOKEN,
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: {
        id: 'open-access-user',
        app_metadata: {},
        user_metadata: { name: 'Guest User' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        role: 'authenticated',
        email: 'guest@example.com',
      }
    };
    
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: mockSession,
      expiresAt: Date.now() + 3600000, // 1 hour from now
    }));
  }
  
  return client;
};
