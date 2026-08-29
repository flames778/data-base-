"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/form";

export function ChangePasswordForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword"),
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong. Please try again.");
      setBusy(false);
      return;
    }

    setSuccess(true);
    setBusy(false);
    setTimeout(() => router.push("/dashboard"), 1200);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white p-8 shadow-2xl">
      <h2 className="text-lg font-semibold text-slate-900">Change your password</h2>
      <p className="mt-1 text-sm text-slate-500">
        For security, you must set a new password before continuing. Your new password
        must be at least 8 characters.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          Password updated. Redirecting…
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Current password">
          <Input type="password" name="currentPassword" required autoComplete="current-password" />
        </Field>
        <Field label="New password">
          <Input type="password" name="newPassword" required minLength={8} autoComplete="new-password" />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={busy}>Update password</Button>
        </div>
      </form>
    </div>
  );
}
