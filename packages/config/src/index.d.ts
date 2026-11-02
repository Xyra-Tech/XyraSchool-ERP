import { AuthTokenPayload } from '@xyratech/shared-types';
export declare const config: {
    env: string;
    isProduction: boolean;
    platformDatabaseUrl: string;
    defaultSchoolDatabaseUrl: string;
    schoolDbBaseUrl: string;
    redisUrl: string;
    platformPort: number;
    schoolPort: number;
    platformJwtSecret: string;
    schoolJwtSecret: string;
    platformJwtExpiresIn: string;
    schoolJwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    encryptionKey: string;
};
export declare function hashPassword(plainText: string): Promise<string>;
export declare function verifyPassword(hash: string, plainText: string): Promise<boolean>;
export declare function encryptField(plainText: string): string;
export declare function decryptField(encryptedPayload: string): string;
export declare function generateBase32Secret(length?: number): string;
export declare function generateTotpCode(secretBase32: string, counterOffset?: number): string;
export declare function verifyTotpCode(secretBase32: string, token: string, window?: number): boolean;
export declare function generateRecoveryCodes(count?: number): {
    plainCodes: string[];
    hashedCodes: string[];
};
export declare function hashSha256(input: string): string;
export declare function signJwtToken(payload: AuthTokenPayload, secret: string, expiresIn?: string): string;
export declare function verifyJwtToken<T = AuthTokenPayload>(token: string, secret: string): T;
//# sourceMappingURL=index.d.ts.map