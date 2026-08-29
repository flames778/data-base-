import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin:
    "Invalid email or password. Please check your credentials properly and try again.",
  Configuration:
    "The sign-in provider is not configured correctly. Please contact your administrator.",
  AccessDenied:
    "Your account is disabled or does not have access to this platform. Contact an administrator.",
  Default: "An unexpected error occurred during sign-in. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default)
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 text-2xl font-black text-white">
            PP
          </div>
          <h1 className="text-2xl font-bold text-white">Prec Pearl</h1>
          <p className="mt-1 text-sm text-blue-200">
            Internal Operations &amp; Records Management Platform
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use your authorized Prec Pearl account please (email + password).
          </p>

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {errorMessage}
            </div>
          )}

          <form
            className="mt-6 space-y-4"
            action={async (formData: FormData) => {
              "use server";
              await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirectTo: "/dashboard",
              });
            }}
          >
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="you@precpearl.local"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
            >
              Sign in
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="font-medium text-blue-600 hover:underline">
              Forgot your password?
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-slate-400">
            Access is restricted to authorized Prec Pearl employees.
          </p>
        </div>
      </div>
    </div>
  );
}
