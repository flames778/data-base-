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
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #0c1c35 0%, #0f2547 50%, #112d55 100%)",
      }}
    >
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-[400px]">
        {/* Logo / brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-2xl shadow-2xl"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
          >
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Prec Pearl</h1>
          <p className="mt-1.5 text-[13px] text-blue-300/80 font-medium">
            Internal Operations &amp; Records Management
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.98)",
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          <div className="mb-6">
            <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Sign in with your authorized account to continue.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errorMessage}
            </div>
          )}

          <form
            className="space-y-4"
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
                className="mb-1.5 block text-[13px] font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[14px] text-slate-900 placeholder-slate-400 transition-all focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-blue-100"
                placeholder="you@precpearl.local"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-[13px] font-medium text-slate-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[14px] text-slate-900 placeholder-slate-400 transition-all focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-blue-100"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-xl px-4 py-3 text-[14px] font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
            >
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            Access is restricted to authorized Prec Pearl employees only.
          </p>
        </div>
      </div>
    </div>
  );
}
