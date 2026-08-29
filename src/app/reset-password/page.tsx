import Link from "next/link";
import { isValidResetToken } from "@/lib/actions/password-reset";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const valid = token ? await isValidResetToken(token) : false;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 text-2xl font-black text-white">
            PP
          </div>
          <h1 className="text-2xl font-bold text-white">Prec Pearl</h1>
          <p className="mt-1 text-sm text-blue-200">Password reset</p>
        </div>

        {token && valid ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="rounded-xl border border-white/10 bg-white p-8 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Invalid or expired link</h2>
            <p className="mt-2 text-sm text-slate-600">
              This password reset link is invalid or has expired. Request a new one below.
            </p>
            <div className="mt-5">
              <Link
                href="/forgot-password"
                className="inline-flex h-10 items-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Request a new link
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
