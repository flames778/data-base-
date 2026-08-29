import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/change-password-form";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const name = session.user.name ?? "there";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 text-2xl font-black text-white">
            PP
          </div>
          <h1 className="text-2xl font-bold text-white">Hello, {name}</h1>
          <p className="mt-1 text-sm text-blue-200">
            Prec Pearl · Secure your account
          </p>
        </div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
