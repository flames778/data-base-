import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateTempPassword,
  generateOpaqueToken,
  validatePasswordStrength,
  MIN_PASSWORD_LENGTH,
} from "@/lib/passwords";

describe("password hashing", () => {
  it("hashes a password such that the plaintext is not stored", async () => {
    const hash = await hashPassword("S3cure-Passw0rd!");
    expect(hash).toBeTruthy();
    expect(hash).not.toContain("S3cure-Passw0rd!");
  });

  it("verifies a correct password", async () => {
    const hash = await hashPassword("S3cure-Passw0rd!");
    expect(await verifyPassword("S3cure-Passw0rd!", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("S3cure-Passw0rd!");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces distinct hashes for the same password (salting)", async () => {
    const a = await hashPassword("S3cure-Passw0rd!");
    const b = await hashPassword("S3cure-Passw0rd!");
    expect(a).not.toEqual(b);
  });
});

describe("validatePasswordStrength", () => {
  it("rejects passwords shorter than the minimum", () => {
    const res = validatePasswordStrength("short".padEnd(MIN_PASSWORD_LENGTH - 1, "x"));
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it("accepts passwords at least the minimum length", () => {
    expect(validatePasswordStrength("a".repeat(MIN_PASSWORD_LENGTH))).toEqual({
      ok: true,
    });
  });
});

describe("temporary password + token generation", () => {
  it("generates a temp password of the requested length", () => {
    const pwd = generateTempPassword();
    expect(pwd.length).toBe(16);
    // Avoids ambiguous characters only.
    expect(pwd).not.toMatch(/[01lIO]/);
  });

  it("throws no error and is unique across calls", () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a).toBeTruthy();
    expect(a.length).toBeGreaterThanOrEqual(40);
    expect(a).not.toEqual(b);
  });
});
