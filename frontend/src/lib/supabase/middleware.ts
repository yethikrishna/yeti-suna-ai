// import { createServerClient, type CookieOptions } from '@supabase/ssr'; // Rimosso
import { type NextRequest, NextResponse } from 'next/server';

// function forceLoginWithReturn(request: NextRequest) { // Rimosso
//   const originalUrl = new URL(request.url);
//   const path = originalUrl.pathname;
//   const query = originalUrl.searchParams.toString();
//   return NextResponse.redirect(
//     new URL(
//       `/auth?returnUrl=${encodeURIComponent(path + (query ? `?${query}` : ''))}`,
//       request.url,
//     ),
//   );
// }

export const validateSession = async (request: NextRequest) => {
  // Rimosso try/catch e tutta la logica Supabase
  // Ora il middleware fa molto poco, potrebbe essere rimosso se non serve per altro
  console.log('!!!!!!!!!! [MIDDLEWARE.TS] Skipping all auth checks.');

  // Restituisce semplicemente la richiesta per continuare la navigazione
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
};
