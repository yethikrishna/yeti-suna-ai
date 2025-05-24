'use client';

import { useEffect, useCallback, useState } from 'react';
import Script from 'next/script';
// import { createClient } from '@/lib/supabase/client'; // Supabase client removed
import { useTheme } from 'next-themes';
import { toast } from 'sonner'; // For user feedback

// Add type declarations for Google One Tap (kept for script loading)
declare global {
  interface Window {
    handleGoogleSignIn?: (response: GoogleSignInResponse) => void;
    google: {
      accounts: {
        id: {
          initialize: (config: GoogleInitializeConfig) => void;
          renderButton: (
            element: HTMLElement,
            options: GoogleButtonOptions,
          ) => void;
          prompt: (
            callback?: (notification: GoogleNotification) => void,
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

// Define types for Google Sign-In (kept for script loading)
interface GoogleSignInResponse {
  credential: string;
  clientId?: string;
  select_by?: string;
}

interface GoogleInitializeConfig {
  client_id: string | undefined;
  callback: ((response: GoogleSignInResponse) => void) | undefined;
  nonce?: string;
  use_fedcm?: boolean;
  context?: string;
  itp_support?: boolean;
}

interface GoogleButtonOptions {
  type?: string;
  theme?: string;
  size?: string;
  text?: string;
  shape?: string;
  logoAlignment?: string;
  width?: number;
}

interface GoogleNotification {
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  getSkippedReason: () => string;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
}

interface GoogleSignInProps {
  returnUrl?: string;
}

export default function GoogleSignIn({ returnUrl }: GoogleSignInProps) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [isLoading, setIsLoading] = useState(false); // Kept for UI feedback if needed
  const { resolvedTheme } = useTheme();

  const handleGoogleSignIn = useCallback(
    async (response: GoogleSignInResponse) => {
      setIsLoading(true);
      console.log('Google Sign-In credential received:', response.credential);
      toast.info("Google Sign-In is currently mocked and does not perform real authentication.");
      
      // Supabase signInWithIdToken call removed
      // const supabase = createClient();
      // const { error } = await supabase.auth.signInWithIdToken({
      //   provider: 'google',
      //   token: response.credential,
      // });
      // if (error) {
      //   console.error('Mocked: Supabase signInWithIdToken error:', error);
      //   toast.error(`Mocked Google Sign-In error: ${error.message}`);
      //   setIsLoading(false);
      //   return;
      // }

      console.log(
        'Mocked: Google sign in would proceed. Redirecting to:',
        returnUrl || '/dashboard',
      );
      
      // Simulate a delay and then redirect.
      // In a real scenario with a new backend, this would call the new backend
      // and then redirect based on its response. The AuthProvider would also update.
      setTimeout(() => {
        // For now, we don't have a new session to set in AuthProvider.
        // The AuthProvider is already setting a mock session on load.
        // This redirect assumes the mock session is sufficient for dashboard access.
        window.location.href = returnUrl || '/dashboard'; 
      }, 1000);
    },
    [returnUrl],
  );

  useEffect(() => {
    window.handleGoogleSignIn = handleGoogleSignIn;

    if (window.google && googleClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleSignIn, // This will now call the mocked version
          use_fedcm: true, // Keep or adjust based on new auth strategy
          context: 'signin',
          itp_support: true,
        });
      } catch (error) {
        console.error("Error initializing Google Accounts ID:", error);
        toast.error("Could not initialize Google Sign-In.");
      }
    }

    return () => {
      delete window.handleGoogleSignIn;
      if (window.google && typeof window.google.accounts?.id?.cancel === 'function') {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          console.warn("Error calling google.accounts.id.cancel():", error);
        }
      }
    };
  }, [googleClientId, handleGoogleSignIn]);

  if (!googleClientId) {
    return (
      <button
        disabled
        className="w-full h-12 flex items-center justify-center gap-2 text-sm font-medium tracking-wide rounded-full bg-background border border-border opacity-60 cursor-not-allowed"
      >
        {/* SVG kept for visual consistency */}
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google Sign-In Not Configured
      </button>
    );
  }

  return (
    <>
      {/* Google One Tap container - kept for potential future use or if parts of GSI still rely on it */}
      <div
        id="g_id_onload"
        data-client_id={googleClientId}
        data-context="signin"
        data-ux_mode="popup"
        data-auto_prompt="false" // Set to false to prevent One Tap from showing automatically
        data-itp_support="true"
        data-callback="handleGoogleSignIn" // Will call the mocked version
      ></div>

      {/* Google Sign-In button container */}
      <div id="google-signin-button" className="w-full h-12">
        {/* The Google button will be rendered here by the GSI script */}
      </div>

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.google && googleClientId) {
            try {
              const buttonContainer = document.getElementById(
                'google-signin-button',
              );
              if (buttonContainer) {
                window.google.accounts.id.renderButton(buttonContainer, {
                  type: 'standard',
                  theme: resolvedTheme === 'dark' ? 'filled_black' : 'outline',
                  size: 'large',
                  text: 'continue_with',
                  shape: 'pill',
                  logoAlignment: 'left',
                  width: buttonContainer.offsetWidth > 0 ? buttonContainer.offsetWidth : undefined, // Ensure width is not 0
                });

                // Custom styling can remain if needed
                setTimeout(() => {
                  const googleButton =
                    buttonContainer.querySelector('div[role="button"]');
                  if (googleButton instanceof HTMLElement) {
                    googleButton.style.borderRadius = '9999px';
                    googleButton.style.width = '100%';
                    // googleButton.style.height = '56px'; // Google might control this
                    googleButton.style.border = '1px solid var(--border)';
                    googleButton.style.background = 'var(--background)';
                    googleButton.style.transition = 'all 0.2s';
                  }
                }, 100);
              } else {
                console.warn("Google Sign-In button container not found for rendering.");
              }
            } catch (error) {
                console.error("Error rendering Google Sign-In button:", error);
                toast.error("Could not render Google Sign-In button.");
            }
          }
        }}
      />
    </>
  );
}
