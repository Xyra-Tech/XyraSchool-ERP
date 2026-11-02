import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  encryptField,
  decryptField,
  generateBase32Secret,
  generateTotpCode,
  verifyTotpCode,
  generateRecoveryCodes,
  hashSha256,
} from '../../packages/config/src';

describe('Cryptographic & Security Foundation Tests', () => {
  it('should hash and verify passwords using Argon2id', async () => {
    const password = 'CorrectHorseBatteryStaple!2026';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash.startsWith('$argon2id$')).toBe(true);

    const isMatch = await verifyPassword(hash, password);
    expect(isMatch).toBe(true);

    const isMismatch = await verifyPassword(hash, 'WrongPassword123!');
    expect(isMismatch).toBe(false);
  });

  it('should perform authenticated field encryption and decryption via AES-256-GCM', () => {
    const sensitiveSecret = 'postgresql://user:secret@isolated-db-host:5432/school_tenant_001';
    const encrypted = encryptField(sensitiveSecret);

    expect(encrypted).not.toEqual(sensitiveSecret);
    const parts = encrypted.split(':');
    expect(parts.length).toBe(3); // iv:tag:ciphertext

    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(sensitiveSecret);
  });

  it('should fail decryption if ciphertext or authentication tag is tampered', () => {
    const encrypted = encryptField('secure-data');
    const parts = encrypted.split(':');
    // Tamper with tag
    const tamperedTag = parts[1].replace(/[0-9a-f]/, 'x');
    const tamperedPayload = `${parts[0]}:${tamperedTag}:${parts[2]}`;

    expect(() => decryptField(tamperedPayload)).toThrow();
  });

  it('should generate valid RFC 6238 TOTP codes and verify within tolerance window', () => {
    const secret = generateBase32Secret(20);
    expect(secret.length).toBe(20);

    const currentCode = generateTotpCode(secret);
    expect(currentCode).toMatch(/^\d{6}$/);

    const isValid = verifyTotpCode(secret, currentCode);
    expect(isValid).toBe(true);

    const isInvalid = verifyTotpCode(secret, '000000');
    expect(isInvalid).toBe(false);
  });

  it('should generate distinct recovery codes and provide verifiable SHA-256 hashes', () => {
    const { plainCodes, hashedCodes } = generateRecoveryCodes(8);

    expect(plainCodes.length).toBe(8);
    expect(hashedCodes.length).toBe(8);

    // Each recovery code has format XXXX-XXXX
    plainCodes.forEach((code) => {
      expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
    });

    // Hash matches
    expect(hashSha256(plainCodes[0])).toBe(hashedCodes[0]);
  });
});
