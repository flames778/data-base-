import nodemailer from "nodemailer";

/**
 * SMTP email delivery used for transactional mail such as password reset links.
 *
 * Email is OPTIONAL at runtime: if SMTP is not configured, sends are skipped
 * gracefully (a helper `isMailConfigured()` lets callers decide messaging)
 * rather than crashing the request. Configure via:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
 *   MAIL_FROM, APP_BASE_URL
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

export function isMailConfigured(): boolean {
  return !!env("SMTP_HOST") && !!env("MAIL_FROM");
}

function transport() {
  if (!transporter) {
    const secure = env("SMTP_SECURE") === "true";
    transporter = nodemailer.createTransport({
      host: env("SMTP_HOST"),
      port: Number(env("SMTP_PORT") ?? (secure ? 465 : 587)),
      secure,
      auth: env("SMTP_USER")
        ? {
            user: env("SMTP_USER")!,
            pass: env("SMTP_PASS") ?? "",
          }
        : undefined,
      // short timeouts so availability of mail never blocks the user flow long
      connectionTimeout: 8000,
      greetingTimeout: 8000,
    });
  }
  return transporter;
}

function baseUrl(): string {
  return env("APP_BASE_URL") ?? env("NEXTAUTH_URL") ?? "http://localhost:3000";
}

export interface SendResult {
  sent: boolean;
  error?: string;
}

/**
 * Send a password reset email to the given address. Never throws — returns a
 * result object so callers can decide whether to surface an "email not
 * configured" notice without breaking the request.
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<SendResult> {
  const from = env("MAIL_FROM");
  const host = env("SMTP_HOST");
  if (!from || !host) {
    return { sent: false, error: "SMTP_MAIL_NOT_CONFIGURED" };
  }
  const url = `${baseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  try {
    await transport().sendMail({
      from,
      to,
      subject: "Prec Pearl — Reset your password",
      text:
        `Hi,\n\n` +
        `We received a request to reset your Prec Pearl password.\n\n` +
        `Open the link below to choose a new password. It expires in 1 hour.\n\n` +
        `${url}\n\n` +
        `If you didn't request this, you can safely ignore this email.\n`,
      html:
        `<p>Hi,</p>` +
        `<p>We received a request to reset your Prec Pearl password.</p>` +
        `<p><a href="${url}">Choose a new password</a> (expires in 1 hour).</p>` +
        `<p>If you didn't request this, you can safely ignore this email.</p>`,
    });
    return { sent: true };
  } catch (e) {
    console.error("Failed to send password reset email:", e);
    return { sent: false, error: "SMTP_SEND_FAILED" };
  }
}
