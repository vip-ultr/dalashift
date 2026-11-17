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
 * The project's JWT secret, used to mint a database access token whose subject
 * is the account id so PostgREST resolves `auth.uid()` and the Row Level
 * Security policies apply. It lives in the Supabase dashboard under Settings,
 * then API, then JWT Secret.
 *
 * This value is required for authenticated data access. Without it the only
 * remaining client is the service-role client, which bypasses RLS, so using it
 * for a farmer-scoped request would expose every farmer's data. We fail closed
 * instead of falling back to that client.
 */
function requireJwtSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    console.error('SUPABASE_JWT_SECRET is not configured; refusing authenticated database access.');
    throw new Error('Database access is not configured.');
  }
  return secret;
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
  // The Secure flag is derived from NEXT_PUBLIC_APP_URL, so that variable must
  // be set to the public https URL in every https deployment. If it is unset
  // there is no trustworthy signal here that the app is served over https and
  // the cookie falls back to non-Secure (also sent over plain http). Treat a
  // missing or http-only value in production as a deployment configuration
  // error; signing in and RLS enforcement still work, but the cookie is not
  // restricted to https.
  const isHttps = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://');
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: Boolean(isHttps),
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

  // Fail closed. Never hand the service-role client to a caller that expects
  // RLS to be enforced; a misconfigured secret must stop the request here.
  const secret = requireJwtSecret();
  const accessToken = createDatabaseAccessToken(parsedAccount.data.id, secret);
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

/**
 * Same-origin check for state-changing requests.
 *
 * Browsers set Origin on every POST/PUT/PATCH/DELETE. When it is absent we
 * cannot prove the request came from our own app, so we reject it rather than
 * trusting it. Referer is a fallback for clients that omit Origin, and is
 * parsed defensively so a malformed value can never throw.
 *
 * NEXT_PUBLIC_APP_URL is the authoritative trusted origin when configured.
 * x-forwarded-host is deliberately ignored: it is set by intermediaries and
 * is not a reliable signal of the origin the browser actually used.
 */
export function hasSameOrigin(request: Request): boolean {
  const suppliedOrigin = readRequestOrigin(request);
  if (!suppliedOrigin) {
    return false;
  }
  return getTrustedOrigins(request).includes(suppliedOrigin);
}

function readRequestOrigin(request: Request): string | null {
  const origin = request.headers.get('origin');
  if (origin) {
    return parseOrigin(origin);
  }
  const referer = request.headers.get('referer');
  if (!referer) {
    return null;
  }
  return parseOrigin(referer);
}

function parseOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    // Sandboxed pages can send the literal string "null"; that is not an
    // origin we can trust.
    if (!url.origin || url.origin === 'null') {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function getTrustedOrigins(request: Request): string[] {
  const trusted = new Set<string>();

  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    const configuredOrigin = parseOrigin(configured);
    if (configuredOrigin) {
      trusted.add(configuredOrigin);
    }
    // When the app URL is configured it is the single source of truth.
    return [...trusted];
  }

  // Fallback for local development and deployments without a configured app
  // URL. Use the Host header, never x-forwarded-host, and take only the scheme
  // from the request URL as reconstructed by the framework.
  try {
    const requestUrl = new URL(request.url);
    const host = request.headers.get('host');
    if (host) {
      trusted.add(`${requestUrl.protocol}//${host.toLowerCase()}`);
    } else {
      trusted.add(requestUrl.origin);
    }
  } catch {
    // An unparsable request URL cannot establish trust; fail closed.
  }

  return [...trusted];
}
