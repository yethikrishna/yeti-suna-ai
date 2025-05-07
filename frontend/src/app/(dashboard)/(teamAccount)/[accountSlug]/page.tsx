'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountRedirect({
  params,
}: {
  params: { accountSlug: string };
}) {
  const router = useRouter();
  const { accountSlug } = params;

  useEffect(() => {
    // Redirect to the settings page on client side
    if (accountSlug) {
      router.push(`/${accountSlug}/settings`);
    }
  }, [accountSlug, router]);

  return <div className="p-8 text-center">Redirecting...</div>;
}
