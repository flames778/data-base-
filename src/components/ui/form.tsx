import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className="mb-1 block text-sm font-medium text-foreground"
      {...props}
    />
  );
}

const inputBase =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 transition-colors";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputBase} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputBase} min-h-[96px]`} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputBase} cursor-pointer`} {...props}>
      {props.children}
    </select>
  );
}

interface FieldProps {
  label?: ReactNode;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, error, hint, children, className = "" }: FieldProps) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
