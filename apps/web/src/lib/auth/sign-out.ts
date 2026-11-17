'use client';

const SIGN_OUT_ERROR = 'Unable to end your session. Please try again.';

/**
 * Revoke the server-side session before navigating away. The redirect is the
 * caller's responsibility and must only happen after this resolves with
 * `ok: true`, so a failed sign-out never strands a still-valid cookie.
 *
 * Shared by every sign-out control so the behaviour stays consistent.
 */
export async function signOut(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (!response.ok) {
      return { ok: false, error: SIGN_OUT_ERROR };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: SIGN_OUT_ERROR };
  }
}
