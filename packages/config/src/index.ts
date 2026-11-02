// ==============================================================================
// XyraTech School ERP — Security, Cryptography & Config Utilities
// ==============================================================================

import crypto from 'node:crypto';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import { AuthTokenPayload } from '@xyratech/shared-types';

dotenv.config();

// ------------------------------------------------------------------------------
// Environment Variables Configuration
// ------------------------------------------------------------------------------
export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  platformDatabaseUrl: process.env.PLATFORM_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/xyratech_platform?schema=public',
  defaultSchoolDatabaseUrl: process.env.DEFAULT_SCHOOL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/xyratech_school_dev?schema=public',
  schoolDbBaseUrl: process.env.SCHOOL_DB_BASE_URL || 'postgresql://postgres:postgres@localhost:5432',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  platformPort: Number(process.env.PLATFORM_API_PORT || 4000),
  schoolPort: Number(process.env.SCHOOL_API_PORT || 5000),
  platformJwtSecret: process.env.PLATFORM_JWT_SECRET || 'dev-insecure-platform-jwt-secret-key-32-chars-min',
  schoolJwtSecret: process.env.SCHOOL_JWT_SECRET || 'dev-insecure-school-jwt-secret-key-32-chars-min',
  platformJwtExpiresIn: process.env.PLATFORM_JWT_EXPIRES_IN || '15m',
  schoolJwtExpiresIn: process.env.SCHOOL_JWT_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.PLATFORM_REFRESH_TOKEN_EXPIRES_IN || '7d',
  encryptionKey: process.env.APP_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
};

// ------------------------------------------------------------------------------
// Password Hashing with Argon2id
// ------------------------------------------------------------------------------
export async function hashPassword(plainText: string): Promise<string> {
  return argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB according to OWASP recommendations
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------------------
// AES-256-GCM Field-Level Encryption & Decryption
// ------------------------------------------------------------------------------
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  return Buffer.from(config.encryptionKey.slice(0, 64), 'hex');
}

export function encryptField(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  // Format: iv:tag:encryptedData
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decryptField(encryptedPayload: string): string {
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted payload');
  }

  const [ivHex, tagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ------------------------------------------------------------------------------
// RFC 6238 TOTP (Time-Based One-Time Password) Implementation
// ------------------------------------------------------------------------------
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateBase32Secret(length = 20): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += BASE32_CHARS[bytes[i] % BASE32_CHARS.length];
  }
  return result;
}

function base32Decode(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_CHARS.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

export function generateTotpCode(secretBase32: string, counterOffset = 0): string {
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = 30;
  const counter = Math.floor(epoch / timeStep) + counterOffset;

  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter));

  const key = base32Decode(secretBase32);
  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = codeInt % 1_000_000;
  return otp.toString().padStart(6, '0');
}

export function verifyTotpCode(secretBase32: string, token: string, window = 1): boolean {
  if (!token || token.length !== 6) return false;
  for (let offset = -window; offset <= window; offset++) {
    if (generateTotpCode(secretBase32, offset) === token) {
      return true;
    }
  }
  return false;
}

// ------------------------------------------------------------------------------
// Recovery Codes Generator
// ------------------------------------------------------------------------------
export function generateRecoveryCodes(count = 8): { plainCodes: string[]; hashedCodes: string[] } {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = `${part1}-${part2}`;
    plainCodes.push(code);
    hashedCodes.push(hashSha256(code));
  }

  return { plainCodes, hashedCodes };
}

export function hashSha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ------------------------------------------------------------------------------
// JWT Utilities
// ------------------------------------------------------------------------------
export function signJwtToken(
  payload: AuthTokenPayload,
  secret: string,
  expiresIn: string = '15m'
): string {
  return jwt.sign(payload, secret as Secret, {
    expiresIn,
    algorithm: 'HS256',
  } as SignOptions);
}

export function verifyJwtToken<T = AuthTokenPayload>(token: string, secret: string): T {
  return jwt.verify(token, secret as Secret) as T;
}
