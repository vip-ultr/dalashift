import { beforeEach, describe, expect, it, vi } from 'vitest';

import { hashPassword } from '../src/lib/auth/core';

const authMocks = vi.hoisted(() => ({
  consumeAuthRateLimit: vi.fn(),
  createSession: vi.fn(),
  getAuthenticationAdminClient: vi.fn(),
  hasSameOrigin: vi.fn(),
}));

vi.mock('../src/lib/auth/server', () => authMocks);

import { POST as register } from '../src/app/api/auth/register/route';
import { POST as login } from '../src/app/api/auth/login/route';

function requestWithBody(body: unknown): Request {
  return new Request('https://app.example.org/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createAccountQuery(existingAccount: unknown | null) {
  const query = {
    eq: vi.fn(),
    insert: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
  };
  query.eq.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data: existingAccount, error: null });
  query.single.mockResolvedValue({
    data: { id: 'b9c9b2ee-6e77-4e31-bd40-58f1125b9e46' },
    error: null,
  });
  return query;
}

describe('first-party registration route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.hasSameOrigin.mockReturnValue(true);
    authMocks.consumeAuthRateLimit.mockResolvedValue(true);
  });

  it('creates a password hash and profile without allowing legacy account claims', async () => {
    const accountQuery = createAccountQuery(null);
    const profileInsert = vi.fn().mockResolvedValue({ error: null });
    const admin = {
      from: vi.fn((table: string) =>
        table === 'local_accounts' ? accountQuery : { insert: profileInsert },
      ),
    };
    authMocks.getAuthenticationAdminClient.mockReturnValue(admin);

    const response = await register(
      requestWithBody({
        fullName: 'Amina Bello',
        identifier: 'Amina@example.org',
        password: 'a-secure-password',
        role: 'farmer',
        consentAccepted: true,
      }),
    );

    expect(response.status).toBe(201);
    expect(accountQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'amina@example.org',
        phone: null,
        password_hash: expect.stringMatching(/^scrypt\$16384\$8\$1\$/),
      }),
    );
    expect(accountQuery.insert.mock.calls[0]?.[0].password_hash).not.toBe('a-secure-password');
    expect(profileInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'b9c9b2ee-6e77-4e31-bd40-58f1125b9e46',
        full_name: 'Amina Bello',
        role: 'farmer',
      }),
    );
    expect(authMocks.createSession).toHaveBeenCalledWith('b9c9b2ee-6e77-4e31-bd40-58f1125b9e46');
  });

  it('does not let a new signup claim a preserved legacy account', async () => {
    const accountQuery = createAccountQuery({ id: 'legacy-account-id' });
    authMocks.getAuthenticationAdminClient.mockReturnValue({
      from: vi.fn(() => accountQuery),
    });

    const response = await register(
      requestWithBody({
        fullName: 'Amina Bello',
        identifier: 'amina@example.org',
        password: 'a-secure-password',
        role: 'farmer',
        consentAccepted: true,
      }),
    );

    expect(response.status).toBe(409);
    expect(accountQuery.insert).not.toHaveBeenCalled();
    expect(authMocks.createSession).not.toHaveBeenCalled();
  });

  it('rejects invalid input before touching the database', async () => {
    const response = await register(
      requestWithBody({
        fullName: 'Amina Bello',
        identifier: 'not-an-identifier',
        password: 'a-secure-password',
        role: 'farmer',
        consentAccepted: true,
      }),
    );

    expect(response.status).toBe(400);
    expect(authMocks.getAuthenticationAdminClient).not.toHaveBeenCalled();
  });

  it('starts a server session after a valid password sign-in', async () => {
    const accountId = 'b9c9b2ee-6e77-4e31-bd40-58f1125b9e46';
    const passwordHash = await hashPassword('a-secure-password');
    const accountQuery = createAccountQuery({ id: accountId, password_hash: passwordHash });
    authMocks.getAuthenticationAdminClient.mockReturnValue({
      from: vi.fn(() => accountQuery),
    });

    const response = await login(
      new Request('https://app.example.org/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'amina@example.org',
          password: 'a-secure-password',
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(authMocks.createSession).toHaveBeenCalledWith(accountId);
  });

  it('keeps preserved legacy accounts locked out until a verified reset', async () => {
    const accountQuery = createAccountQuery({
      id: 'legacy-account-id',
      password_hash: null,
    });
    authMocks.getAuthenticationAdminClient.mockReturnValue({
      from: vi.fn(() => accountQuery),
    });

    const response = await login(
      new Request('https://app.example.org/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'legacy@example.org',
          password: 'a-secure-password',
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(authMocks.createSession).not.toHaveBeenCalled();
  });
});
