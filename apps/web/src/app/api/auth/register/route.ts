import { NextResponse } from 'next/server';
import { z } from 'zod';

import { hashPassword, normalizeIdentifier } from '../../../../lib/auth/core';
import {
  consumeAuthRateLimit,
  createSession,
  getAuthenticationAdminClient,
  hasSameOrigin,
} from '../../../../lib/auth/server';

const registerSchema = z.object({
  fullName: z.string().trim().max(120).optional().default('Farmer'),
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(6).max(128),
  role: z.string().optional().default('farmer'),
  consentAccepted: z.boolean().optional().default(true),
});

const DUPLICATE_ACCOUNT =
  'An account with this email or phone number already exists. Please sign in instead.';

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

  const parsed = registerSchema.safeParse(body);
  const identifier = parsed.success ? normalizeIdentifier(parsed.data.identifier) : null;
  if (!parsed.success || !identifier) {
    return NextResponse.json(
      {
        error: 'Enter a valid email address or international phone number and complete all fields.',
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const email = identifier && 'email' in identifier ? identifier.email : null;
    const phone = identifier && 'phone' in identifier ? identifier.phone : null;
    if (!(await consumeAuthRateLimit(request, 'register', JSON.stringify(identifier)))) {
      return NextResponse.json(
        { error: 'Too many account requests. Please wait and try again.' },
        { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': '900' } },
      );
    }

    const admin = getAuthenticationAdminClient();
    let accountQuery = admin.from('local_accounts').select('id').limit(1);
    accountQuery = email ? accountQuery.eq('email', email) : accountQuery.eq('phone', phone);
    const { data: existingAccount, error: lookupError } = await accountQuery.maybeSingle();

    if (lookupError) {
      console.error('Failed to check account availability', { code: lookupError.code });
      return NextResponse.json(
        { error: 'Account service is temporarily unavailable.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (existingAccount) {
      return NextResponse.json(
        { error: DUPLICATE_ACCOUNT },
        { status: 409, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const { data: account, error: createError } = await admin
      .from('local_accounts')
      .insert({
        email,
        phone,
        password_hash: passwordHash,
      })
      .select('id')
      .single();

    if (createError || !account) {
      if (createError?.code === '23505') {
        return NextResponse.json(
          { error: DUPLICATE_ACCOUNT },
          { status: 409, headers: { 'Cache-Control': 'no-store' } },
        );
      }
      console.error('Failed to create account', { code: createError?.code });
      return NextResponse.json(
        { error: 'Unable to create the account. Please try again.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const { error: profileError } = await admin.from('profiles').insert({
      id: account.id,
      full_name: parsed.data.fullName || 'Farmer',
      phone,
      role: 'farmer',
    });

    if (profileError) {
      const { error: rollbackError } = await admin
        .from('local_accounts')
        .delete()
        .eq('id', account.id);
      console.error('Failed to create account profile', {
        code: profileError.code,
        rollbackCode: rollbackError?.code,
      });
      return NextResponse.json(
        { error: 'Unable to create the account. Please try again.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    try {
      await createSession(account.id);
    } catch (error) {
      const { error: rollbackError } = await admin
        .from('local_accounts')
        .delete()
        .eq('id', account.id);
      console.error('Failed to start new account session', {
        rollbackCode: rollbackError?.code,
        error: error instanceof Error ? error.name : 'UnknownError',
      });
      return NextResponse.json(
        { error: 'Unable to start your session. Please try signing in.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Account registration failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { error: 'Account service is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
