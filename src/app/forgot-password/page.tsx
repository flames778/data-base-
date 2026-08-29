import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 text-2xl font-black text-white">
            PP
          </div>
          <h1 className="text-2xl font-bold text-white">Prec Pearl</h1>
          <p className="mt-1 text-sm text-blue-200">
            Password recovery
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
