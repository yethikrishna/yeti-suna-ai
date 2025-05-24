'use server';

// import { createClient } from '@/lib/supabase/server'; // Supabase client removed
import { redirect } from 'next/navigation'; // Keep redirect for now, though flow will change
import { siteConfig } from '@/lib/site'; // For redirect paths

// Mock user ID, similar to backend auth_utils
const MOCK_USER_ID = process.env.MOCK_USER_ID || "mock_user_id_001";

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  // const password = formData.get('password') as string; // Password no longer checked against Supabase
  const returnUrl = formData.get('returnUrl') as string | undefined;

  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address.' };
  }

  // No password validation against Supabase, just a basic check if needed
  // if (!password || password.length < 6) {
  //   return { message: 'Password must be at least 6 characters (mock check).' };
  // }

  // Simulate successful sign-in
  console.log(`Mock SignIn attempt for email: ${email}`);
  // In a real non-Supabase scenario, you'd call your new backend here.
  // For now, we assume any valid-looking email "logs in" to the mock session.

  // The AuthProvider now handles setting a mock session.
  // This server action's primary role for redirection might change.
  // For now, let's return a success that the AuthProvider/page can use to redirect.
  return { success: true, redirectTo: returnUrl || siteConfig.paths.dashboard };
}

export async function signUp(prevState: any, formData: FormData) {
  // const origin = formData.get('origin') as string; // Used for emailRedirectTo with Supabase
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const returnUrl = formData.get('returnUrl') as string | undefined;

  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address.' };
  }

  if (!password || password.length < 6) {
    return { message: 'Password must be at least 6 characters.' };
  }

  if (password !== confirmPassword) {
    return { message: 'Passwords do not match.' };
  }

  // Simulate successful sign-up and immediate "login" with mock session
  console.log(`Mock SignUp attempt for email: ${email}`);
  // In a real non-Supabase scenario, you'd call your new backend here to register the user.
  // For now, we assume any valid sign-up "succeeds" and "logs in".

  // Similar to signIn, AuthProvider handles the session.
  return { success: true, redirectTo: returnUrl || siteConfig.paths.dashboard };
  // Or, to simulate email verification:
  // return { success: true, message: "Account created! Please check your email for a verification link (mocked)." };
}

export async function forgotPassword(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  // const origin = formData.get('origin') as string; // Used for emailRedirectTo

  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address.' };
  }

  console.log(`Mock ForgotPassword attempt for email: ${email}`);
  // Simulate sending a password reset email
  // In a real non-Supabase scenario, your backend would handle this.

  return {
    success: true,
    message: 'If an account with this email exists, a password reset link has been sent (mocked).',
  };
}

export async function resetPassword(prevState: any, formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || password.length < 6) {
    return { message: 'Password must be at least 6 characters.' };
  }

  if (password !== confirmPassword) {
    return { message: 'Passwords do not match.' };
  }

  console.log(`Mock ResetPassword attempt.`);
  // Simulate updating the user's password
  // In a real non-Supabase scenario, your backend would handle this, likely requiring a reset token.

  return {
    success: true,
    message: 'Password updated successfully (mocked). You can now sign in with your new password.',
  };
}

export async function signOut() {
  console.log(`Mock SignOut attempt.`);
  // The actual session clearing is handled by AuthProvider on the client-side.
  // This server action might just be for initiating a redirect or server-side cleanup if any.
  // For now, it can simply redirect to home.
  // The client-side logout in AuthProvider will clear local mock session state.
  return redirect(siteConfig.paths.home); 
}
