import { createClient } from '@/lib/supabase/server';
import AccountBillingStatus from '@/components/billing/account-billing-status';

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

export default async function PersonalAccountBillingPage() {
  const supabaseClient = await createClient();
  const { data: personalAccount } = await supabaseClient.rpc(
    'get_personal_account',
  );

  if (!personalAccount || !personalAccount.account_id) {
    return (
      <div>
        <h2>Gestione Fatturazione</h2>
        <p>La gestione della fatturazione non è disponibile in questa modalità.</p>
      </div>
    );
  }

  return (
    <div>
      <AccountBillingStatus
        accountId={personalAccount.account_id}
        returnUrl={`${returnUrl}/settings/billing`}
      />
    </div>
  );
}
