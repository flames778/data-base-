import { prisma } from "@/lib/prisma";

/**
 * Basic brute-force protection for the credentials sign-in flow.
 *
 * Backed by the database (not in-memory) so it works correctly regardless of
 * how the app is deployed — a single process, multiple replicas behind a
 * load balancer, or serverless functions that don't share memory. The
 * trade-off is one extra query per login attempt, which is negligible next
 * to the cost of an unthrottled password-guessing endpoint.
 *
 * Two independent limits are enforced:
 *  - per email:  stops an attacker from grinding one specific account.
 *  - per IP:     stops an attacker from spraying many accounts from one
 *                source (email-based limiting alone wouldn't catch this).
 *
 * This is a reasonable baseline, not a replacement for edge/CDN-level
 * protection (e.g. Cloudflare, a WAF, or your reverse proxy) if you have one
 * in front of the app — those catch abuse earlier and cheaper. Add this
 * regardless, since you may not always have such a layer in front of you.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS_PER_EMAIL = 5;
const MAX_ATTEMPTS_PER_IP = 20;

export class RateLimitedError extends Error {
  constructor(message = "Too many sign-in attempts. Please try again later.") {
    super(message);
  }
}

/**
 * Throws RateLimitedError if the email or IP has too many recent failed
 * attempts. Call this BEFORE verifying the password.
 */
export async function assertNotRateLimited(email: string, ipAddress: string | null): Promise<void> {
  const since = new Date(Date.now() - WINDOW_MS);

  const emailAttempts = await prisma.loginAttempt.count({
    where: { email, createdAt: { gte: since } },
  });
  if (emailAttempts >= MAX_ATTEMPTS_PER_EMAIL) {
    throw new RateLimitedError();
  }

  if (ipAddress) {
    const ipAttempts = await prisma.loginAttempt.count({
      where: { ipAddress, createdAt: { gte: since } },
    });
    if (ipAttempts >= MAX_ATTEMPTS_PER_IP) {
      throw new RateLimitedError();
    }
  }
}

/** Record a failed sign-in attempt. Call this whenever authorize() rejects. */
export async function recordFailedAttempt(email: string, ipAddress: string | null): Promise<void> {
  try {
    await prisma.loginAttempt.create({ data: { email, ipAddress } });
  } catch {
    // Never let rate-limit bookkeeping break the sign-in flow itself.
  }
}

/**
 * Clear an email's recent failed attempts after a successful sign-in, so a
 * legitimate user who mistyped their password a few times isn't left
 * sitting close to the threshold.
 */
export async function clearAttempts(email: string): Promise<void> {
  try {
    await prisma.loginAttempt.deleteMany({ where: { email } });
  } catch {
    // Best-effort cleanup only.
  }
}

/** Extract a best-effort client IP from request headers (proxy-aware). */
export function extractIp(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip");
}
