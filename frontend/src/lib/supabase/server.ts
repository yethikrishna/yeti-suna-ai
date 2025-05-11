'use server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();
  // let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!; // Vecchia riga
  // Determina l'URL di Supabase in base all'ambiente (server o client)
  // Per il server-side (dentro Docker), usa il nome del servizio Docker e la porta interna.
  let supabaseUrl = 'http://kong:8000'; // Ripristinato per il server-side
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Ensure the URL is in the proper format with http/https protocol
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    // If it's just a hostname without protocol, add http://
    supabaseUrl = `http://${supabaseUrl}`;
  }

  // console.log('[SERVER] Supabase URL:', supabaseUrl);
  // console.log('[SERVER] Supabase Anon Key:', supabaseAnonKey);

  console.log('!!!!!!!!!! [SERVER.TS] CREATING SUPABASE CLIENT WITH URL:', supabaseUrl, 'AND KEY:', supabaseAnonKey);
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
