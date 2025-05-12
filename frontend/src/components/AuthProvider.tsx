'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { useSWRConfig } from 'swr';

// Definizione di un utente e sessione fittizi
const DUMMY_USER_ID = 'dummy_user_id'; // Deve corrispondere a quello usato nel backend

const dummyUser: User = {
  id: DUMMY_USER_ID,
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { name: 'Dummy User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  // Aggiungi altri campi minimi richiesti da User se necessario
  // email: 'dummy@example.com', // Esempio se l'email è strettamente necessaria
};

const dummySession: Session = {
  access_token: 'dummy_access_token',
  refresh_token: 'dummy_refresh_token',
  expires_in: 3600,
  token_type: 'bearer',
  user: dummyUser,
  // Aggiungi altri campi minimi richiesti da Session se necessario
};

type AuthContextType = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>; // signOut probabilmente non verrà usato, ma lo manteniamo per coerenza
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user ?? null);
        } else {
          // Nessuna sessione reale, usa i dati fittizi
          console.log('[AuthProvider] No real session, using dummy user and session.');
          setSession(dummySession);
          setUser(dummyUser);
        }
      } catch (error) {
        console.error('[AuthProvider] Error getting initial session:', error);
        // Errore nel recuperare la sessione, usa comunque i dati fittizi
        setSession(dummySession);
        setUser(dummyUser);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        const previousSession = session; // Cattura la sessione prima dell'aggiornamento

        if (newSession) {
          setSession(newSession);
          setUser(newSession.user ?? null);
        } else {
          // Logout o sessione scaduta/invalidata, reimposta ai dati fittizi
          console.log('[AuthProvider] Auth state changed to no session, using dummy user and session.');
          setSession(dummySession);
          setUser(dummyUser);
        }

        // Invalida la cache SWR per gli account se lo stato di login è cambiato
        // (anche se con i dati fittizi, "isLoggedIn" sarà sempre vero)
        const isLoggedIn = !!(newSession || dummyUser); // Considera fittizio come loggato
        const wasLoggedIn = !!previousSession?.user;

        if (isLoggedIn !== wasLoggedIn) {
          console.log('[AuthProvider] Auth state changed, invalidating accounts cache.');
          mutate(['accounts'], undefined, { revalidate: false });
          // Potresti voler invalidare altre chiavi SWR che dipendono dalla sessione qui
        }
        
        // Assicurati che isLoading sia false dopo il primo caricamento o cambiamento
        if (isLoading) setIsLoading(false);
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
    // Rimosso isLoading, session dalle dipendenze per evitare loop se dummySession/User causano ri-render
  }, [supabase, mutate]); 

  const signOut = async () => {
    // Anche se l'autenticazione reale è bypassata, simuliamo un signOut
    // reimpostando ai valori fittizi (gestito da onAuthStateChange)
    await supabase.auth.signOut(); 
    console.log('[AuthProvider] signOut called, will reset to dummy user/session via onAuthStateChange.');
    // Non c'è bisogno di aggiornare lo stato qui, onAuthStateChange lo farà
  };

  const value = {
    supabase,
    session, // Sarà dummySession se non loggato
    user,    // Sarà dummyUser se non loggato
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
