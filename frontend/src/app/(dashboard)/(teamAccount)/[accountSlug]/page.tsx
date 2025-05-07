'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

type AccountParams = {
  accountSlug: string;
};

export function generateStaticParams() {
  return [
    { accountSlug: 'personal' },
    { accountSlug: 'team' },
    { accountSlug: 'default' }
  ];
}

export default function AccountRedirect({
  params,
}: {
  params: AccountParams;
}) {
  const { accountSlug } = params;

  useEffect(() => {
    // Redirect to the settings page on client side
    window.location.href = `/${accountSlug}/settings`;
  }, [accountSlug]);

  return <div className="p-8 text-center">Redirecting...</div>;
}
