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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-sky-900 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 opacity-80" style={{
        backgroundImage: "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.40), transparent 18%), radial-gradient(circle at 80% 15%, rgba(125,211,252,0.28), transparent 20%), radial-gradient(circle at 50% 80%, rgba(14,165,233,0.24), transparent 22%)",
      }} />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-400 text-xl font-black text-white shadow-[0_20px_35px_rgba(59,130,246,0.35)] ring-1 ring-white/20">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Prec Pearl</h1>
          <p className="mt-2 text-sm font-medium text-blue-100/90">Password reset</p>
        </div>

        {token && valid ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="rounded-[28px] border border-white/15 bg-white/95 p-8 shadow-[0_25px_70px_rgba(15,23,42,0.45)] backdrop-blur-sm">
            <h2 className="text-[18px] font-semibold text-slate-900">Invalid or expired link</h2>
            <p className="mt-2 text-sm text-slate-600">
              This password reset link is invalid or has expired. Request a new one below.
            </p>
            <div className="mt-5">
              <Link
                href="/forgot-password"
                className="inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(37,99,235,0.35)]"
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
