"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        const msg =
          res.error === "CredentialsSignin"
            ? "Invalid email or password. Please check your credentials."
            : res.error === "too-many-attempts"
              ? "Too many attempts. Please wait 15 minutes."
              : res.error;
        setError(msg);
        return;
      }
      if (res?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={pending}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.75 text-[14px] text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
          placeholder="you@precpearl.local"
        />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-[13px] font-semibold text-slate-700">
            Password
          </label>
          <Link href="/forgot-password" className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={pending}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.75 text-[14px] text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-4 py-3 text-[14px] font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(37,99,235,0.42)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {pending && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
