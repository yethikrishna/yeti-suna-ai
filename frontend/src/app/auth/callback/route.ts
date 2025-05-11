import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  console.log("AUTH_CALLBACK: Received request");
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const returnUrl = requestUrl.searchParams.get('returnUrl');
  const origin = requestUrl.origin;

  console.log(`AUTH_CALLBACK: Code: ${code}, Return URL: ${returnUrl}, Origin: ${origin}`);

  if (code) {
    const supabase = await createClient();
    try {
      console.log("AUTH_CALLBACK: Attempting to exchange code for session...");
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("AUTH_CALLBACK: Error exchanging code for session:", error);
        // Potresti voler reindirizzare a una pagina di errore qui
        return NextResponse.redirect(`${origin}/auth/auth-code-error`); // o gestire l'errore diversamente
      }
      console.log("AUTH_CALLBACK: Successfully exchanged code for session.");
    } catch (e) {
      console.error("AUTH_CALLBACK: Exception during exchangeCodeForSession:", e);
      // Gestire eccezioni impreviste
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
  } else {
    console.warn("AUTH_CALLBACK: No code found in request URL.");
  }

  // URL to redirect to after sign up process completes
  // Handle the case where returnUrl is 'null' (string) or actual null
  const redirectPath =
    returnUrl && returnUrl !== 'null' ? returnUrl : '/dashboard';
  // Make sure to include a slash between origin and path if needed
  const finalRedirectUrl = `${origin}${redirectPath.startsWith('/') ? '' : '/'}${redirectPath}`;

  console.log(`AUTH_CALLBACK: Determined redirect path: ${redirectPath}`);
  console.log(`AUTH_CALLBACK: Final redirect URL: ${finalRedirectUrl}`);

  return NextResponse.redirect(finalRedirectUrl);
}
