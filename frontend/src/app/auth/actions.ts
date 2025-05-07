'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export async function signIn(prevState: any, formData: FormData) {
  return { success: true, redirectTo: '/dashboard' };
}

export async function signUp(prevState: any, formData: FormData) {
  return { success: true, redirectTo: '/dashboard' };
}

export async function forgotPassword(prevState: any, formData: FormData) {
  return {
    success: true,
    message: 'No password needed - PIA is free for everyone!',
  };
}

export async function resetPassword(prevState: any, formData: FormData) {
  return {
    success: true,
    message: 'No password needed - PIA is free for everyone!',
  };
}

export async function signOut() {
  window.location.href = '/';
  return null;
}
