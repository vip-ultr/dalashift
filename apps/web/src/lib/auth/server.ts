import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { z } from 'zod';

import {
  createDatabaseAccessToken,
  createSessionToken,
  hashRateLimitBucket,
  hashSessionToken,
} from './core';
import { createServiceRoleClient } from '../supabase/service';

export const SESSION_COOKIE_NAME = 'dalashift_session';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const sessionRowSchema = z.object({ user_id: z.string().uuid() });
const accountRowSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
});

/**
 * The project's JWT secret, or null when it is not configured.
 *
 * The secret is what lets the app mint a database access token whose subject
 * is the account id, so PostgREST resolves `auth.uid()` and the existing Row
 * Level Security policies apply. It lives in the Supabase dashboard under
 * Settings, then API, then JWT Secret.
 *
 * It is deliberately not fatal here. Without it, signing in still works and
 * the session is still created; what does not work is reading farmer-scoped
 * rows, because the database would treat the request as anonymous.
 */
function getJwtSecret(): string | null {
  return process.env.SUPABASE_JWT_SECRET ?? null;
}

export function getAuthenticationAdminClient() {
  const client = createServiceRoleClient();
  if (!client) {
    throw new Error('First-party authentication storage is not configured.');
  }
  return client;
}

export async function createSession(userId: string): Promise<void> {
  const admin = getAuthenticationAdminClient();
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  const { error } = await admin.from('local_sessions').insert({
    user_id: userId,
    token_hash: hashSessionToken(token),
    expires_at: expiresAt,
  });

  if (error) {
    console.error('Failed to create authentication session', { code: error.code });
    throw new Error('Unable to create an authentication session.');
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const admin = getAuthenticationAdminClient();
    const { error } = await admin
      .from('local_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', hashSessionToken(token))
      .is('revoked_at', null);

    if (error) {
      console.error('Failed to revoke authentication session', { code: error.code });
      throw new Error('Unable to end the authentication session.');
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function createClient(accessToken?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase database access is not configured.');
  }

  return createSupabaseClient(supabaseUrl, anonKey, {
    ...(accessToken ? { accessToken: async () => accessToken } : {}),
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function getAuthenticatedClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const admin = getAuthenticationAdminClient();
  const { data: session, error: sessionError } = await admin
    .from('local_sessions')
    .select('user_id')
    .eq('token_hash', hashSessionToken(token))
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (sessionError) {
    console.error('Failed to verify authentication session', { code: sessionError.code });
    throw new Error('Unable to verify the authentication session.');
  }
  if (!session) {
    return null;
  }
  const parsedSession = sessionRowSchema.safeParse(session);
  if (!parsedSession.success) {
    console.error('Authentication session record was invalid');
    throw new Error('Unable to verify the authentication session.');
  }

  const { data: account, error: accountError } = await admin
    .from('local_accounts')
    .select('id, email, phone')
    .eq('id', parsedSession.data.user_id)
    .maybeSingle();

  if (accountError) {
    console.error('Failed to load authentication account', { code: accountError.code });
    throw new Error('Unable to load the authentication account.');
  }
  if (!account) {
    return null;
  }
  const parsedAccount = accountRowSchema.safeParse(account);
  if (!parsedAccount.success) {
    console.error('Authentication account record was invalid');
    throw new Error('Unable to load the authentication account.');
  }

  const secret = getJwtSecret();
  const accessToken = secret ? createDatabaseAccessToken(parsedAccount.data.id, secret) : null;
  return {
    user: {
      id: parsedAccount.data.id,
      email: parsedAccount.data.email,
      phone: parsedAccount.data.phone,
    },
    supabase: await createClient(accessToken ?? undefined),
  };
}

export async function consumeAuthRateLimit(
  request: Request,
  action: 'login' | 'register',
  identifier?: string,
): Promise<boolean> {
  const admin = getAuthenticationAdminClient();
  const forwardedIp =
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  const buckets = [`${action}:ip:${forwardedIp}`];
  if (identifier) {
    buckets.push(`${action}:identifier:${identifier}`);
  }

  for (const bucket of buckets) {
    const { data, error } = await admin.rpc('consume_auth_rate_limit', {
      p_bucket: hashRateLimitBucket(bucket),
      p_limit: action === 'login' ? 10 : 5,
      p_window_seconds: 900,
    });
    if (error || typeof data !== 'boolean') {
      console.error('Authentication rate limit check failed', { code: error?.code });
      throw new Error('Authentication rate limiting is unavailable.');
    }
    if (!data) {
      return false;
    }
  }

  return true;
}

export function hasSameOrigin(request: Request): boolean {
  const origin =
    request.headers.get('origin') ??
    (request.headers.get('referer') ? new URL(request.headers.get('referer')!).origin : null);

  if (!origin) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const rawHost = forwardedHost ?? request.headers.get('host') ?? requestUrl.host;
    const requestHost = rawHost.toLowerCase();
    const requestHostname = requestHost.split(':')[0];

    if (
      originUrl.host.toLowerCase() === requestHost ||
      originUrl.hostname.toLowerCase() === requestHostname
    ) {
      return true;
    }

    const configuredHosts = [
      process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : null,
      process.env.VERCEL_URL ? new URL(`https://${process.env.VERCEL_URL}`).hostname : null,
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`).hostname
        : null,
      'localhost',
      '127.0.0.1',
    ].filter(Boolean) as string[];

    if (configuredHosts.includes(originUrl.hostname.toLowerCase())) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
