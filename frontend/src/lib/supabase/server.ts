'use server';
// Usa createClient standard invece di createServerClient
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
// import { cookies } from 'next/headers'; // Rimosso

export const createClient = async () => {
  // const cookieStore = await cookies(); // Rimosso
  let supabaseUrl = process.env.SUPABASE_INTERNAL_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Ensure the URL is in the proper format with http/https protocol (optional if var is always full)
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `http://${supabaseUrl}`;
  }

  console.log('!!!!!!!!!! [SERVER.TS] CREATING STANDARD SUPABASE CLIENT (NO SSR/COOKIES) WITH INTERNAL URL:', supabaseUrl, 'AND KEY:', supabaseAnonKey);
  // Crea un client standard senza opzioni specifiche per SSR/cookies
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    // Opzioni standard, se necessarie (es. auth: { persistSession: false } se vuoi essere esplicito)
    auth: {
      persistSession: false, // Non tentare di persistere sessioni (anche se non ci sarà login)
      autoRefreshToken: false, // Non serve refresh automatico
      detectSessionInUrl: false, // Non cercare sessioni nell'URL
    }
  });
};
