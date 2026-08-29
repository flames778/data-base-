import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const prismaUser = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  };
  const mail = {
    isMailConfigured: vi.fn(() => true),
    sendPasswordResetEmail: vi.fn(async () => ({ sent: true })),
  };
  return { prismaUser, mail };
});

vi.mock("@/lib/prisma", () => ({ prisma: { user: mocks.prismaUser } }));
vi.mock("@/lib/mail", () => mocks.mail);
vi.mock("@/lib/passwords", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/passwords")>();
  return { ...actual, hashPassword: vi.fn(async (p: string) => `hash:${p}`) };
});
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({
  audit: { user: vi.fn(async () => {}) },
  clientInfo: vi.fn(() => ({ ipAddress: null, userAgent: null })),
}));
vi.mock("@/lib/actions/util", () => ({
  errorResult: () => ({ ok: false as const, error: "op failed" }),
}));

import { requestPasswordReset, resetPasswordWithToken, isValidResetToken } from "@/lib/actions/password-reset";
import { sendPasswordResetEmail, isMailConfigured } from "@/lib/mail";

function nowPlus(ms: number): Date {
  return new Date(Date.now() + ms);
}

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a generic success and sends nothing for an unknown email (anti-enumeration)", async () => {
    mocks.prismaUser.findUnique.mockResolvedValue(null);
    const res = await requestPasswordReset({ email: "nobody@example.com" });
    expect(res.ok).toBe(true);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("does not mint a new token when an unexpired one already exists", async () => {
    mocks.prismaUser.findUnique.mockResolvedValue({
      id: "u1", email: "a@b.com", status: "ACTIVE", passwordHash: "h",
      passwordResetToken: "existing", passwordResetExpiresAt: nowPlus(60_000),
    });
    const res = await requestPasswordReset({ email: "a@b.com" });
    expect(res.ok).toBe(true);
    expect(mocks.prismaUser.update).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("mints a new token and emails it when none exists", async () => {
    mocks.prismaUser.findUnique.mockResolvedValue({
      id: "u1", email: "a@b.com", status: "ACTIVE", passwordHash: "h",
      passwordResetToken: null, passwordResetExpiresAt: null,
    });
    const res = await requestPasswordReset({ email: "a@b.com" });
    expect(res.ok).toBe(true);
    expect(mocks.prismaUser.update).toHaveBeenCalled();
    const data = mocks.prismaUser.update.mock.calls[0][0].data;
    expect(data.passwordResetToken).toBeTruthy();
    expect(data.passwordResetExpiresAt).toBeInstanceOf(Date);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith("a@b.com", expect.any(String));
  });

  it("reports whether mail is configured", async () => {
    mocks.prismaUser.findUnique.mockResolvedValue(null);
    const res = await requestPasswordReset({ email: "nobody@example.com" });
    expect(res.ok).toBe(true);
    expect(isMailConfigured).toHaveBeenCalled();
  });
});

describe("resetPasswordWithToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an expired token", async () => {
    mocks.prismaUser.findUnique.mockResolvedValue({
      id: "u1",
      passwordResetToken: "tok",
      passwordResetExpiresAt: nowPlus(-1000),
    });
    const res = await resetPasswordWithToken({ token: "tok", newPassword: "NewPassword123!" });
    expect(res.ok).toBe(false);
  });

  it("rejects an unknown token", async () => {
    mocks.prismaUser.findUnique.mockResolvedValue(null);
    const res = await resetPasswordWithToken({ token: "nope", newPassword: "NewPassword123!" });
    expect(res.ok).toBe(false);
    expect(res.invalid).toBe(true);
  });

  it("updates the password hash and clears the token on success", async () => {
    mocks.prismaUser.findUnique.mockResolvedValue({
      id: "u1", email: "a@b.com",
      passwordResetToken: "tok", passwordResetExpiresAt: nowPlus(60_000),
    });
    const res = await resetPasswordWithToken({ token: "tok", newPassword: "NewPassword123!" });
    expect(res.ok).toBe(true);
    expect(mocks.prismaUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({
          passwordHash: "hash:NewPassword123!",
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        }),
      })
    );
  });

  it("rejects a weak new password", async () => {
    const res = await resetPasswordWithToken({ token: "tok", newPassword: "short" });
    expect(res.ok).toBe(false);
  });
});

describe("isValidResetToken", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns false for an empty token", async () => {
    expect(await isValidResetToken("")).toBe(false);
  });

  it("returns true for an unexpired token", async () => {
    mocks.prismaUser.findFirst.mockResolvedValue({
      id: "u1", passwordResetExpiresAt: nowPlus(60_000),
    });
    expect(await isValidResetToken("tok")).toBe(true);
  });

  it("returns false for an expired token", async () => {
    mocks.prismaUser.findFirst.mockResolvedValue({
      id: "u1", passwordResetExpiresAt: nowPlus(-1000),
    });
    expect(await isValidResetToken("tok")).toBe(false);
  });
});
