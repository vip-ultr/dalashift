import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  createDatabaseAccessToken,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  normalizeIdentifier,
  verifyPassword,
} from '../src/lib/auth/core';

describe('first-party authentication primitives', () => {
  it('normalizes email and international phone identifiers', () => {
    expect(normalizeIdentifier(' Farmer@Example.ORG ')).toEqual({
      email: 'farmer@example.org',
    });
    expect(normalizeIdentifier('+234 801-234-5678')).toEqual({
      phone: '+2348012345678',
    });
    expect(normalizeIdentifier('08012345678')).toBeNull();
    expect(normalizeIdentifier('not-an-email')).toBeNull();
  });

  it('hashes passwords with unique salts and verifies them safely', async () => {
    const firstHash = await hashPassword('a-secure-password');
    const secondHash = await hashPassword('a-secure-password');

    expect(firstHash).not.toBe(secondHash);
    expect(await verifyPassword('a-secure-password', firstHash)).toBe(true);
    expect(await verifyPassword('another-password', firstHash)).toBe(false);
    expect(await verifyPassword('a-secure-password', 'not-a-hash')).toBe(false);
  });

  it('stores only a digest of the random opaque session token', () => {
    const token = createSessionToken();
    const digest = hashSessionToken(token);

    expect(token).toHaveLength(43);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).not.toBe(token);
  });

  it('signs a short-lived authenticated database token for the account UUID', () => {
    const secret = 'test-secret';
    const token = createDatabaseAccessToken(
      'b9c9b2ee-6e77-4e31-bd40-58f1125b9e46',
      secret,
      1_800_000_000_000,
    );
    const [headerPart, payloadPart, signature] = token.split('.');
    if (!headerPart || !payloadPart || !signature) {
      throw new Error('Database access token was not a JWT.');
    }
    const unsignedToken = `${headerPart}.${payloadPart}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(unsignedToken)
      .digest('base64url');
    const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));

    expect(signature).toBe(expectedSignature);
    expect(header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(payload).toMatchObject({
      aud: 'authenticated',
      iss: 'supabase',
      role: 'authenticated',
      sub: 'b9c9b2ee-6e77-4e31-bd40-58f1125b9e46',
      iat: 1_800_000_000,
      exp: 1_800_000_300,
    });
  });
});
