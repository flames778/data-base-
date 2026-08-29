"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/form";

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const res = await requestPasswordReset({ email: String(fd.get("email") ?? "") });
    setBusy(false);

    if (!res.ok) { setError(res.error ?? "Something went wrong."); return; }

    // Generic success regardless of whether the account exists (anti-enumeration).
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-white/10 bg-white p-8 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-900">Check your email</h2>
        <p className="mt-2 text-sm text-slate-600">
          If an account exists for that address, we&apos;ve sent a link to reset your
          password. The link expires in 1 hour.
        </p>
        <div className="mt-5 text-sm">
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white p-8 shadow-2xl">
      <h2 className="text-lg font-semibold text-slate-900">Reset your password</h2>
      <p className="mt-1 text-sm text-slate-500">
        Enter your account email and we&apos;ll send you a link to set a new password.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" placeholder="you@precpearl.local" />
        </Field>
        <div className="flex items-center justify-between">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Back to sign in
          </Link>
          <Button type="submit" loading={busy}>Send reset link</Button>
        </div>
      </form>
    </div>
  );
}
