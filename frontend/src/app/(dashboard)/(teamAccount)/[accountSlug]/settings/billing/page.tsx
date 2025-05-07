'use client';

import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type AccountParams = {
  accountSlug: string;
};

export function generateStaticParams() {
  return [
    { accountSlug: 'team' },
    { accountSlug: 'default' }
  ];
}

export default function TeamBillingPage({
  params,
}: {
  params: AccountParams;
}) {
  const { accountSlug } = params;

  const [teamAccount, setTeamAccount] = React.useState<any>({
    account_id: 'team-account',
    name: 'Team Account',
    slug: accountSlug || 'team',
    personal: false,
    role: 'owner',
    account_role: 'owner',
  });
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
  }, [accountSlug]);

  if (error) {
    return (
      <Alert
        variant="destructive"
        className="border-red-300 dark:border-red-800 rounded-xl"
      >
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!teamAccount) {
    return <div>Loading...</div>;
  }

  if (teamAccount.account_role !== 'owner') {
    return (
      <Alert
        variant="destructive"
        className="border-red-300 dark:border-red-800 rounded-xl"
      >
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to access this page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-medium text-card-title">Team Billing</h3>
        <p className="text-sm text-foreground/70">
          Manage your team's subscription and billing details.
        </p>
      </div>

      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-6">
        <p className="text-green-700 dark:text-green-400">
          PIA is completely free! There are no subscription fees or usage limits for your team.
        </p>
      </div>
      
      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-medium mb-2">Current Plan</h2>
          <p className="text-sm text-muted-foreground mb-4">Your team is on the unlimited free plan with access to all features.</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">$0</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </div>
      </div>
    </div>
  );
}
