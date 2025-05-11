'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const returnUrl = formData.get('returnUrl') as string | undefined;

  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address' };
  }

  if (!password || password.length < 6) {
    return { message: 'Password must be at least 6 characters' };
  }

  const supabase = await createClient();
  console.log('[ACTIONS.TS SIGNIN] Attempting to sign in with email:', email);

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('[ACTIONS.TS SIGNIN] Supabase auth error:', error);
    return { message: error.message || 'Could not authenticate user (Supabase error)' };
  }

  if (!data.user && !data.session) {
      console.warn('[ACTIONS.TS SIGNIN] Signed in successfully according to Supabase, but no user or session data returned. This might indicate an issue.');
  }
  
  console.log('[ACTIONS.TS SIGNIN] Sign-in successful. Session should be set. Redirecting server-side to:', returnUrl || '/dashboard');
  
  redirect(returnUrl || '/dashboard');
}

export async function signUp(prevState: any, formData: FormData) {
  const origin = formData.get('origin') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const returnUrl = formData.get('returnUrl') as string | undefined;

  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address' };
  }

  if (!password || password.length < 6) {
    return { message: 'Password must be at least 6 characters' };
  }

  if (password !== confirmPassword) {
    return { message: 'Passwords do not match' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl || '/dashboard')}`,
    },
  });

  if (error) {
    return { message: error.message || 'Could not create account' };
  }

  const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.warn('[ACTIONS.TS SIGNUP] Immediate sign-in after signup failed. User needs to verify email.', signInError);
    return {
      success: false,
      message:
        'Account created! Check your email to confirm your registration.',
    };
  }

  if (!signInData.user && !signInData.session) {
    console.warn('[ACTIONS.TS SIGNUP] Immediate sign-in after signup successful, but no user/session data. User likely needs to verify email.');
    return {
      success: false,
      message:
        'Account created! Check your email to confirm your registration and complete sign-in.',
    };
  }

  console.log('[ACTIONS.TS SIGNUP] SignUp and immediate sign-in successful. Redirecting server-side to:', returnUrl || '/dashboard');
  redirect(returnUrl || '/dashboard');
}

export async function forgotPassword(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const origin = formData.get('origin') as string;

  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) {
    return { message: error.message || 'Could not send password reset email' };
  }

  return {
    success: true,
    message: 'Check your email for a password reset link',
  };
}

export async function resetPassword(prevState: any, formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || password.length < 6) {
    return { message: 'Password must be at least 6 characters' };
  }

  if (password !== confirmPassword) {
    return { message: 'Passwords do not match' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { message: error.message || 'Could not update password' };
  }

  return {
    success: true,
    message: 'Password updated successfully',
  };
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { message: error.message || 'Could not sign out' };
  }

  return redirect('/');
}
