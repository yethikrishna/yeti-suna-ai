import { NextRequest } from 'next/server';
import { validateSession } from '@/lib/supabase/middleware'; // Assumendo che @ sia src/

export async function middleware(request: NextRequest) {
  return await validateSession(request);
}

// Optionale: Configurazione del matcher per il middleware
// Specifica i percorsi su cui questo middleware deve essere eseguito.
// Adatta questo secondo le tue necessità.
export const config = {
  matcher: [
    /*
     * Abbina tutti i percorsi di richiesta eccetto quelli che iniziano con:
     * - api (percorsi API)
     * - _next/static (file statici)
     * - _next/image (ottimizzazione immagini)
     * - favicon.ico (file favicon)
     * - /auth (percorsi di autenticazione, per evitare loop di redirect)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
    // Includi esplicitamente i percorsi che vuoi proteggere se non sono coperti sopra,
    // o se vuoi che il middleware gestisca sempre la sessione per loro,
    // anche se non sono "protetti" nel senso di richiedere un login.
    // Ad esempio, se vuoi che /dashboard sia sempre processato dal middleware:
     '/dashboard/:path*',
     '/invitation/:path*',
  ],
}; 