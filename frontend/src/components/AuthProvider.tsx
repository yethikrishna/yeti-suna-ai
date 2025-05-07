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
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: user,
  } as Session;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const mockUser = createMockUser();
  const mockSession = createMockSession(mockUser);
  
  const [session, setSession] = useState<Session | null>(mockSession);
  const [user, setUser] = useState<User | null>(mockUser);
  const [isLoading, setIsLoading] = useState(false); // Set to false immediately

  // No need for authentication checks - we're always authenticated
  useEffect(() => {
    const initSupabase = async () => {
      setIsLoading(false);
    };

    initSupabase();
    
    // No need for auth listener
    return () => {
    };
  }, [supabase]);

  const signOut = async () => {
    setSession(mockSession);
    setUser(mockUser);
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
