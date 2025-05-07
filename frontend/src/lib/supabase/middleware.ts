import { type NextRequest, NextResponse } from 'next/server';

export const validateSession = async (request: NextRequest) => {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
};
