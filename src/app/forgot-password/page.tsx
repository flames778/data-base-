import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
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
          <p className="mt-2 text-sm font-medium text-blue-100/90">
            Password recovery
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
