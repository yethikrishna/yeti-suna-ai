import { createClient } from '@/lib/supabase/server';

export default async function PersonalAccountSettingsPage() {
  const supabaseClient = await createClient();
  // const { data: personalAccount } = await supabaseClient.rpc(
  //   'get_personal_account',
  // ); // Rimosso

  return (
    <div>
      {/* <EditPersonalAccountName account={personalAccount} /> */}
      {/* Contenuto rimosso temporaneamente */}
    </div>
  );
}
