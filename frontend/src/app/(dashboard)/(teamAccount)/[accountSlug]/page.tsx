'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

type AccountParams = {
  accountSlug: string;
};

export default function AccountRedirect({
  params,
}: {
  params: Promise<AccountParams>;
}) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const { accountSlug } = unwrappedParams;

  useEffect(() => {
    // Redirect to the settings page on client side
    if (accountSlug) {
      router.push(`/${accountSlug}/settings`);
    }
  }, [accountSlug, router]);

  return <div className="p-8 text-center">Redirecting...</div>;
}
