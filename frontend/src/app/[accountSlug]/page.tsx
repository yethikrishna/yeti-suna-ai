'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountRedirect({ params }: { params: { accountSlug: string } }) {
  const router = useRouter();
  const { accountSlug } = params;

  useEffect(() => {
    if (accountSlug) {
      router.push(`/dashboard`);
    }
  }, [accountSlug, router]);

  return <div className="p-8 text-center">Redirecting...</div>;
}
