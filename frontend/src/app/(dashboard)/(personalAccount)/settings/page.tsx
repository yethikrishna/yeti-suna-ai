'use client';

import { useState } from 'react';
import EditPersonalAccountName from '@/components/basejump/edit-personal-account-name';

export default function PersonalAccountSettingsPage() {
  const personalAccount = {
    account_id: 'free-account',
    name: 'Personal Account',
    slug: 'personal',
    personal: true,
    role: 'owner',
    is_primary_owner: true,
    personal_account: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {}
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      <div className="space-y-6">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-medium mb-4">Personal Information</h2>
          <EditPersonalAccountName account={personalAccount} />
        </div>
      </div>
    </div>
  );
}
