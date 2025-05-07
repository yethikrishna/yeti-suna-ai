'use client';

import { createClient } from '../supabase/client';

export async function removeTeamMember(prevState: any, formData: FormData) {
  const returnUrl = formData.get('returnUrl') as string;
  
  window.location.href = returnUrl || '/dashboard';
  return { success: true };
}

export async function updateTeamMemberRole(prevState: any, formData: FormData) {
  const returnUrl = formData.get('returnUrl') as string;
  
  window.location.href = returnUrl || '/dashboard';
  return { success: true };
}
