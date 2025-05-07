'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditTeamName from '@/components/basejump/edit-team-name';
import EditTeamSlug from '@/components/basejump/edit-team-slug';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function generateStaticParams() {
  return [
    { accountSlug: 'team' },
    { accountSlug: 'default' }
  ];
}

type AccountParams = {
  accountSlug: string;
};

export default function TeamSettingsPage({
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
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(false);
  }, [accountSlug]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!teamAccount) {
    return <div>Account not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-card-title">Team Settings</h3>
        <p className="text-sm text-foreground/70">
          Manage your team account details.
        </p>
      </div>

      <Card className="border-subtle dark:border-white/10 bg-white dark:bg-background-secondary shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-card-title">Team Name</CardTitle>
          <CardDescription>Update your team name.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditTeamName account={teamAccount} />
        </CardContent>
      </Card>

      <Card className="border-subtle dark:border-white/10 bg-white dark:bg-background-secondary shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-card-title">Team URL</CardTitle>
          <CardDescription>Update your team URL slug.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditTeamSlug account={teamAccount} />
        </CardContent>
      </Card>
    </div>
  );
}
