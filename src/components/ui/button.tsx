import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-[0.01em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-60 disabled:pointer-events-none active:translate-y-0.5";

const variants: Record<string, string> = {
  primary: "bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(37,99,235,0.35)]",
  secondary:
    "bg-white text-slate-700 border border-sky-200 shadow-sm hover:border-sky-300 hover:bg-sky-50",
  outline:
    "bg-transparent text-slate-700 border border-slate-200 hover:bg-slate-50",
  ghost: "bg-transparent hover:bg-blue-50 text-blue-700",
  danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_12px_24px_rgba(239,68,68,0.25)] hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(239,68,68,0.30)]",
  success: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-[0_12px_24px_rgba(16,185,129,0.22)] hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(16,185,129,0.30)]",
};

const sizes: Record<string, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

interface LinkButtonProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
