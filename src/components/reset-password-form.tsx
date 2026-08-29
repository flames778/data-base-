"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPasswordWithToken } from "@/lib/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/form";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const newPassword = String(fd.get("newPassword") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }

    const res = await resetPasswordWithToken({ token, newPassword });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-white/10 bg-white p-8 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-900">Password updated</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your password has been changed. You can now sign in with your new password.
        </p>
        <div className="mt-5 text-sm">
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white p-8 shadow-2xl">
      <h2 className="text-lg font-semibold text-slate-900">Choose a new password</h2>
      <p className="mt-1 text-sm text-slate-500">
        Your new password must be at least 8 characters.
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
        <Field label="New password">
          <Input type="password" name="newPassword" required minLength={8} autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" name="confirm" required minLength={8} autoComplete="new-password" />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={busy}>Update password</Button>
        </div>
      </form>
    </div>
  );
}
