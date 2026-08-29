"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { errorResult } from "@/lib/actions/util";
import { audit, clientInfo } from "@/lib/audit";
import { requestPasswordResetSchema, resetPasswordSchema } from "@/lib/validation";
import {
  hashPassword,
  generateOpaqueToken,
  validatePasswordStrength,
} from "@/lib/passwords";
import { sendPasswordResetEmail, isMailConfigured } from "@/lib/mail";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Request a password reset for an email address.
 *
 * Anti-enumeration: this endpoint always returns the same generic success
 * message whether or not the email exists, so callers cannot discover which
 * accounts are registered. If a token is generated it is emailed to the user.
 */
export async function requestPasswordReset(input: unknown) {
  try {
    const parsed = requestPasswordResetSchema.parse(input);
    const email = parsed.email.trim().toLowerCase();

    // Idempotence + simple rate control: if an unexpired token already exists
    // for this user, do not mint another (prevents mail spam on repeat hits).
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.status === "ACTIVE" && user.passwordHash) {
      const fresh = !(
        user.passwordResetToken &&
        user.passwordResetExpiresAt &&
        user.passwordResetExpiresAt.getTime() > Date.now()
      );

      if (fresh) {
        const token = generateOpaqueToken();
        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordResetToken: token,
            passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
          },
        });
        await sendPasswordResetEmail(user.email, token);
      }
    }

    return {
      ok: true as const,
      mailConfigured: isMailConfigured(),
    };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * Complete a password reset using the token from the emailed link.
 */
export async function resetPasswordWithToken(input: unknown) {
  try {
    const parsed = resetPasswordSchema.parse(input);

    const strength = validatePasswordStrength(parsed.newPassword);
    if (!strength.ok) return { ok: false as const, error: strength.error };

    const user = await prisma.user.findUnique({
      where: { passwordResetToken: parsed.token },
    });

    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      return {
        ok: false as const,
        error: "This reset link is invalid or has expired. Please request a new one.",
        invalid: true as const,
      };
    }

    const h = await headers();
    const info = clientInfo(h);

    const passwordHash = await hashPassword(parsed.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        mustChangePassword: false,
      },
    });

    await audit.user(user, {
      action: "user.password_reset_completed",
      resource: "User",
      resourceId: user.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
    });

    revalidatePath("/login");
    return { ok: true as const };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * Validate that a token is present and unexpired without consuming it.
 * Used by the /reset-password page to decide whether to show the form.
 */
export async function isValidResetToken(token: string): Promise<boolean> {
  if (!token) return false;
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token },
    select: { id: true, passwordResetExpiresAt: true },
  });
  return !!(
    user &&
    user.passwordResetExpiresAt &&
    user.passwordResetExpiresAt.getTime() > Date.now()
  );
}
