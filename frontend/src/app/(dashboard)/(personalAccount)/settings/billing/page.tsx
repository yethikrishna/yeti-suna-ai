'use client';

import { useEffect, useState } from 'react';
import AccountBillingStatus from '@/components/billing/account-billing-status';

export function generateStaticParams() {
  return [{ slug: 'billing' }];
}

export default function PersonalAccountBillingPage() {
  const [accountId, setAccountId] = useState('free-account');
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-6">
        <p className="text-green-700 dark:text-green-400">
          PIA is completely free! There are no subscription fees or usage limits.
        </p>
      </div>
      
      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-medium mb-2">Current Plan</h2>
          <p className="text-sm text-muted-foreground mb-4">You are on the unlimited free plan with access to all features.</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">$0</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </div>
      </div>
    </div>
  );
}
