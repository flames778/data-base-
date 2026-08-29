import { hash, compare } from "bcryptjs";
import { randomBytes } from "crypto";

const SALT_ROUNDS = 12;

export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordPolicyResult {
  ok: boolean;
  error?: string;
}

/**
 * Enforce a reasonable password policy. Returns an error string when the
 * password does not meet the minimum requirements.
 */
export function validatePasswordStrength(password: string): PasswordPolicyResult {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  return { ok: true };
}

/** Hash a plaintext password with bcrypt (never store plaintext). */
export async function hashPassword(plaintext: string): Promise<string> {
  return hash(plaintext, SALT_ROUNDS);
}

/** Compare a plaintext candidate against a stored bcrypt hash. */
export async function verifyPassword(candidate: string, storedHash: string): Promise<boolean> {
  return compare(candidate, storedHash);
}

/**
 * Generate a cryptographically random, human-typable temporary password.
 * Avoids ambiguous characters (0/O, 1/l/I) for easier manual entry.
 */
export function generateTempPassword(length = 16): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/**
 * Generate a random opaque token for password-reset links. Unlike a password
 * there is no need to read it back, so any entropy source is fine.
 */
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
