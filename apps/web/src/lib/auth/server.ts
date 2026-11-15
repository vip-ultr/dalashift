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

function getJwtSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('First-party authentication is not configured.');
  }
  return secret;
}

export function getAuthenticationAdminClient() {
  const client = createServiceRoleClient();
  if (!client) {
    throw new Error('First-party authentication storage is not configured.');
  }
  getJwtSecret();
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

  const accessToken = createDatabaseAccessToken(parsedAccount.data.id, getJwtSecret());
  return {
    user: {
      id: parsedAccount.data.id,
      email: parsedAccount.data.email,
      phone: parsedAccount.data.phone,
    },
    supabase: await createClient(accessToken),
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
  const origin = request.headers.get('origin');
  if (!origin) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const requestHost =
      request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? requestUrl.host;
    const requestProtocol =
      request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ??
      requestUrl.protocol.slice(0, -1);

    return (
      originUrl.host.toLowerCase() === requestHost.toLowerCase() &&
      originUrl.protocol === `${requestProtocol}:`
    );
  } catch {
    return false;
  }
}
