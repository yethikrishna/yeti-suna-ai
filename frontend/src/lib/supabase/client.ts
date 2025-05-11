import { createBrowserClient } from '@supabase/ssr';

// Access environment variables using process.env for Next.js
// Update to use NEXT_PUBLIC_ prefix for client-side access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing. Check your frontend .env file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
    throw new Error('Frontend: Supabase URL and/or Anon Key are not defined. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your frontend .env file.');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
})();

// Uncomment and implement the createClient function that AuthProvider is trying to use
export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Frontend: Supabase URL and/or Anon Key are not defined for createClient.');
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
