'use client';

import { createClient } from '../supabase/client';

export async function createInvitation(
  prevState: any,
  formData: FormData,
): Promise<{ token?: string; message?: string }> {
  return {
    token: 'mock-invitation-token-' + Date.now(),
  };
}

export async function deleteInvitation(prevState: any, formData: FormData) {
  const returnPath = formData.get('returnPath') as string;
  
  window.location.href = returnPath || '/dashboard';
  return { success: true };
}

export async function acceptInvitation(prevState: any, formData: FormData) {
  window.location.href = '/dashboard';
  return { success: true };
}
