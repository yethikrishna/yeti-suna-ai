import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnUrl = requestUrl.searchParams.get('returnUrl');
  const origin = requestUrl.origin;

  // URL to redirect to after sign up process completes
  // Handle the case where returnUrl is 'null' (string) or actual null
  const redirectPath =
    returnUrl && returnUrl !== 'null' ? returnUrl : '/dashboard';
  
  // Make sure to include a slash between origin and path if needed
  return NextResponse.redirect(
    `${origin}${redirectPath.startsWith('/') ? '' : '/'}${redirectPath}`,
  );
}
