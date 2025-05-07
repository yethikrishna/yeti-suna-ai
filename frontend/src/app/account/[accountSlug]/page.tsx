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
    if (accountSlug) {
      router.push(`/dashboard`);
    }
  }, [accountSlug, router]);

  return <div className="p-8 text-center">Redirecting...</div>;
}
