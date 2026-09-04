import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin:
    "Invalid email or password. Please check your credentials properly and try again.",
  "too-many-attempts":
    "Too many sign-in attempts. Please wait 15 minutes and try again.",
  Configuration:
    "The sign-in provider is not configured correctly. Please contact your administrator.",
  AccessDenied:
    "Your account is disabled or does not have access to this platform. Contact an administrator.",
  Default: "An unexpected error occurred during sign-in. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const { error, code } = await searchParams;
  const errorMessage = error
    ? (ERROR_MESSAGES[code ?? ""] ?? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default)
    : null;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{
        background: "linear-gradient(135deg, #0a1630 0%, #102550 40%, #173d72 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{
        backgroundImage: "radial-gradient(circle at 20% 20%, rgba(96, 165, 250, 0.30), transparent 20%), radial-gradient(circle at 80% 10%, rgba(125, 211, 252, 0.22), transparent 26%), radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.18), transparent 22%)",
      }} />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-[64px] w-[64px] items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-400 shadow-[0_18px_38px_rgba(59,130,246,0.45)] ring-1 ring-white/20">
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Prec Pearl</h1>
          <p className="mt-2 text-[13px] font-medium text-blue-100/85">
            Internal Operations &amp; Records Management
          </p>
        </div>

        <div className="rounded-[28px] border border-white/15 bg-white/96 p-7 shadow-[0_30px_90px_rgba(15,23,42,0.52)] backdrop-blur-sm">
          <div className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">Welcome</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-slate-900">Sign in to continue</h2>
            <p className="mt-1.5 text-[13px] text-slate-500">
              Use your authorized account to access the platform.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 shadow-sm"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errorMessage}
            </div>
          )}

          <LoginForm />

          <p className="mt-6 text-center text-[11px] text-slate-400">
            Access is restricted to authorized Prec Pearl employees only.
          </p>
        </div>
      </div>
    </div>
  );
}
