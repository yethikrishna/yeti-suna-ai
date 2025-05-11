import React from 'react';
import { TeamSettingsClientLayout } from './team-settings-client-layout';

type LayoutParams = {
  accountSlug: string;
};

export default async function TeamSettingsLayout({
  children,
  params: paramsPromise,
}: {
  children: React.ReactNode;
  params: Promise<LayoutParams>;
}) {
  const params = await paramsPromise;
  const { accountSlug } = params;

  return (
    <TeamSettingsClientLayout accountSlug={accountSlug}>
      {children}
    </TeamSettingsClientLayout>
  );
}
