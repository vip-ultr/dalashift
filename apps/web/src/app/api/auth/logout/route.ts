import { NextResponse } from 'next/server';

import { hasSameOrigin, revokeCurrentSession } from '../../../../lib/auth/server';

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }

  try {
    await revokeCurrentSession();
    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Account sign-out failed', {
      error: error instanceof Error ? error.message : 'UnknownError',
    });
    return NextResponse.json(
      { error: 'Unable to end your session. Please try again.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
