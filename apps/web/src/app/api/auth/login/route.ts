import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  hashPassword,
  isLegacyHash,
  normalizeIdentifier,
  verifyPassword,
} from '../../../../lib/auth/core';
import {
  consumeAuthRateLimit,
  createSession,
  getAuthenticationAdminClient,
  hasSameOrigin,
} from '../../../../lib/auth/server';

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(128),
});

const DUMMY_PASSWORD_HASH = `scrypt$16384$8$1$${'0'.repeat(32)}$${'0'.repeat(128)}`;

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 16_384) {
    return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  const identifier = parsed.success ? normalizeIdentifier(parsed.data.identifier) : null;
  if (!parsed.success || !identifier) {
    return NextResponse.json(
      { error: 'Enter a valid email address or international phone number and password.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    if (!(await consumeAuthRateLimit(request, 'login', JSON.stringify(identifier)))) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Please wait and try again.' },
        { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': '900' } },
      );
    }

    const admin = getAuthenticationAdminClient();
    let accountQuery = admin.from('local_accounts').select('id, password_hash').limit(1);
    accountQuery =
      'email' in identifier
        ? accountQuery.eq('email', identifier.email)
        : accountQuery.eq('phone', identifier.phone);
    const { data: account, error } = await accountQuery.maybeSingle();

    if (error) {
      console.error('Failed to load account for sign-in', { code: error.code });
      return NextResponse.json(
        { error: 'Account service is temporarily unavailable.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const passwordHash = account?.password_hash ?? DUMMY_PASSWORD_HASH;
    const passwordMatches = await verifyPassword(parsed.data.password, passwordHash);
    if (!account || !account.password_hash || !passwordMatches) {
      return NextResponse.json(
        { error: 'The email or phone number and password do not match.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    await createSession(account.id);

    // A hash that predates the move off Supabase Auth is upgraded the first
    // time the account signs in, so the bcrypt format does not linger.
    if (isLegacyHash(passwordHash)) {
      const admin = getAuthenticationAdminClient();
      await admin
        .from('local_accounts')
        .update({ password_hash: await hashPassword(parsed.data.password) })
        .eq('id', account.id);
    }
    return NextResponse.json(
      { success: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Account sign-in failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { error: 'Account service is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
