'use server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();
  let supabaseUrl = process.env.SUPABASE_INTERNAL_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Ensure the URL is in the proper format with http/https protocol (optional if var is always full)
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `http://${supabaseUrl}`;
  }

  console.log('!!!!!!!!!! [SERVER.TS] CREATING SUPABASE CLIENT WITH INTERNAL URL:', supabaseUrl, 'AND KEY:', supabaseAnonKey);
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set({ name, value, ...options }),
          );
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};
