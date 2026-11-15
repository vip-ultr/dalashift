import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as deriveKeyCallback,
  timingSafeEqual,
} from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const PASSWORD_KEY_LENGTH = 64;
const emailSchema = z.string().email().max(254);

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    deriveKeyCallback(
      password,
      salt,
      PASSWORD_KEY_LENGTH,
      {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
        maxmem: 64 * 1024 * 1024,
      },
      (error, key) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(key);
      },
    );
  });
}

export function normalizeIdentifier(value: string): { email: string } | { phone: string } | null {
  const identifier = value.trim();
  if (identifier.includes('@')) {
    const email = identifier.toLowerCase();
    return emailSchema.safeParse(email).success ? { email } : null;
  }

  let phone = identifier.replace(/[\s().-]/g, '');
  if (phone.startsWith('0') && phone.length === 11) {
    phone = `+234${phone.slice(1)}`;
  } else if (!phone.startsWith('+') && /^\d{10,14}$/.test(phone)) {
    phone = `+${phone}`;
  }
  return /^\+[1-9]\d{7,14}$/.test(phone) ? { phone } : null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt);

  return [
    'scrypt',
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString('hex'),
    derivedKey.toString('hex'),
  ].join('$');
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  // Accounts that predate the move off Supabase Auth carry a GoTrue bcrypt
  // hash. Those passwords keep working, and the hash is upgraded to scrypt the
  // next time the account signs in.
  if (/^\$2[aby]\$/.test(encodedHash)) {
    try {
      return await bcrypt.compare(password, encodedHash);
    } catch {
      return false;
    }
  }

  const [algorithm, cost, blockSize, parallelization, saltHex, keyHex] = encodedHash.split('$');
  if (
    algorithm !== 'scrypt' ||
    cost !== String(SCRYPT_COST) ||
    blockSize !== String(SCRYPT_BLOCK_SIZE) ||
    parallelization !== String(SCRYPT_PARALLELIZATION) ||
    !saltHex ||
    !/^[0-9a-f]{32}$/i.test(saltHex) ||
    !keyHex ||
    !/^[0-9a-f]{128}$/i.test(keyHex)
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expectedKey = Buffer.from(keyHex, 'hex');
  const actualKey = await deriveKey(password, salt);

  return timingSafeEqual(actualKey, expectedKey);
}

/**
 * Whether a stored hash predates the move off Supabase Auth.
 *
 * Such a hash is upgraded to scrypt the next time the account signs in.
 */
export function isLegacyHash(encodedHash: string): boolean {
  return /^\$2[aby]\$/.test(encodedHash);
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hashRateLimitBucket(bucket: string): string {
  return createHash('sha256').update(bucket).digest('hex');
}

export function createDatabaseAccessToken(
  userId: string,
  secret: string,
  now = Date.now(),
): string {
  const issuedAt = Math.floor(now / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      aud: 'authenticated',
      exp: issuedAt + 5 * 60,
      iat: issuedAt,
      iss: 'supabase',
      role: 'authenticated',
      sub: userId,
    }),
  ).toString('base64url');
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(unsignedToken).digest('base64url');

  return `${unsignedToken}.${signature}`;
}

export function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}
