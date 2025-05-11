import useSWR, { SWRConfiguration } from 'swr';
import { createClient } from '@/lib/supabase/client';
import { GetAccountsResponse } from '@usebasejump/shared';

export const useAccounts = (options?: SWRConfiguration) => {
  const supabaseClient = createClient();

  const defaultOptions: SWRConfiguration = {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  };

  const swrOptions = { ...defaultOptions, ...options };

  return useSWR<GetAccountsResponse | null>(
    !!supabaseClient && ['accounts'],
    async () => {
      // DIAGNOSTIC: Add a small delay
      await new Promise(resolve => setTimeout(resolve, 500)); // Ritardo di 0.5 secondi

      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      console.log('[useAccounts] Supabase session (in fetcher):', session);
      if (sessionError) {
        console.error('[useAccounts] Error getting session:', sessionError);
        throw new Error(sessionError.message);
      }

      if (!session) {
        console.log('[useAccounts] No active session, returning null.');
        return null; // Return null if no session
      }

      const { data, error } = await supabaseClient.rpc('get_accounts');
      console.log('[useAccounts] Supabase RPC get_accounts data:', data);
      console.log('[useAccounts] Supabase RPC get_accounts error:', error);

      if (error) {
        console.error('[useAccounts] Error fetching accounts:', error);
        throw error;
      }
      return data as GetAccountsResponse;
    },
    swrOptions,
  );
};
