'use client';

import { createClient } from '../supabase/client';

export async function createTeam(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  
  window.location.href = `/${slug || 'dashboard'}`;
  return { success: true };
}

export async function editTeamName(prevState: any, formData: FormData) {
  return { success: true };
}

export async function editTeamSlug(prevState: any, formData: FormData) {
  const slug = formData.get('slug') as string;
  
  window.location.href = `/${slug || 'dashboard'}/settings`;
  return { success: true };
}
