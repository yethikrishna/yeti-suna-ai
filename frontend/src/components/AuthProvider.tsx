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

type AuthContextType = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_ACCESS_TOKEN = 'mock-access-token-for-open-access-' + Date.now();

const createMockUser = (): User => {
  return {
    id: 'open-access-user',
    app_metadata: {},
    user_metadata: { name: 'Guest User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    role: 'authenticated',
    email: 'guest@example.com',
  } as User;
};

const createMockSession = (user: User): Session => {
  return {
    access_token: MOCK_ACCESS_TOKEN,
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: user,
  } as Session;
};

const createMockSupabaseClient = (originalClient: SupabaseClient, mockSession: Session) => {
  const mockClient = {
    ...originalClient,
    auth: {
      ...originalClient.auth,
      getSession: async () => {
        return { data: { session: mockSession }, error: null };
      },
      getUser: async () => {
        return { data: { user: mockSession.user }, error: null };
      },
      signOut: async () => {
        return { error: null };
      },
      onAuthStateChange: (callback: any) => {
        setTimeout(() => {
          callback('SIGNED_IN', { session: mockSession });
        }, 0);
        
        return { 
          data: { subscription: { unsubscribe: () => {} } },
          error: null
        };
      }
    }
  };
  
  return mockClient as unknown as SupabaseClient;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const originalSupabase = createClient();
  const mockUser = createMockUser();
  const mockSession = createMockSession(mockUser);
  
  const supabase = createMockSupabaseClient(originalSupabase, mockSession);
  
  const [session, setSession] = useState<Session | null>(mockSession);
  const [user, setUser] = useState<User | null>(mockUser);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: mockSession,
      expiresAt: Date.now() + 3600000, // 1 hour from now
    }));
    
    setIsLoading(false);
  }, [mockSession]);

  const signOut = async () => {
    // Do nothing on sign out - we always stay authenticated
    return;
  };

  const value = {
    supabase,
    session,
    user,
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
