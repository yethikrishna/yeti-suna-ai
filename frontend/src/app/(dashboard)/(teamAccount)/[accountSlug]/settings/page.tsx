import React from 'react';
import TeamSettingsClientPage from './team-settings-client-page'; // Assicurati che il percorso sia corretto

type AccountParams = {
  accountSlug: string;
};

// export default function TeamSettingsPage({ // Vecchia firma
export default async function TeamSettingsPage({
  params: paramsPromise,
}: {
  // params: AccountParams; // Vecchia tipizzazione
  params: Promise<AccountParams>; // Nuova tipizzazione
}) {
  const params = await paramsPromise; // Risolvi la promise
  const { accountSlug } = params;

  return <TeamSettingsClientPage accountSlug={accountSlug} />;
}
