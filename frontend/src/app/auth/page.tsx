'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Auth page that automatically redirects to the dashboard
 * This bypasses the authentication requirement as requested
 */
export default function AuthPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/dashboard');
  }, [router]);
  
  // Show loading spinner while redirecting
  return (
    <main className="flex flex-col items-center justify-center min-h-screen w-full">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Redirecting to PIA dashboard...</p>
      </div>
    </main>
  );
}
