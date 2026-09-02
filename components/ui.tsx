import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export function cnx(...classes: Array<string | false | null | undefined>) {
  return cn(classes.filter(Boolean).join(" "));
}

export function Card({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cnx(
        "rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-stone-800 dark:bg-black",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const variants = {
    primary:
      "border-black bg-black text-white hover:bg-stone-800 dark:border-white dark:bg-white dark:text-black dark:hover:bg-stone-200",
    secondary:
      "border-stone-300 bg-white text-stone-900 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:hover:bg-stone-800",
    ghost:
      "border-transparent bg-transparent text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800",
    danger: "border-red-600 bg-red-600 text-white hover:bg-red-700",
  };
  const sizes = {
    sm: "h-9 rounded-lg px-3 text-xs",
    md: "h-10 rounded-xl px-4 text-sm",
  };

  return (
    <button
      {...props}
      className={cnx(
        "inline-flex shrink-0 items-center justify-center gap-2 border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-stone-500 dark:focus-visible:ring-offset-black",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cnx(
        "h-10 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200 placeholder:text-stone-400 disabled:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:bg-black dark:text-white dark:focus:border-stone-500 dark:focus:ring-stone-800 dark:placeholder:text-stone-600 dark:disabled:bg-stone-900",
        className,
      )}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cnx(
        "min-h-24 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200 placeholder:text-stone-400 dark:border-stone-700 dark:bg-black dark:text-white dark:focus:border-stone-500 dark:focus:ring-stone-800 dark:placeholder:text-stone-600",
        className,
      )}
    />
  );
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs leading-5 text-stone-500 dark:text-stone-500">{hint}</span> : null}
    </label>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone = ["running", "ready", "success", "completed"].includes(normalized)
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
    : ["failed", "error", "cancelled"].includes(normalized)
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
      : ["queued", "pending", "building", "deploying"].includes(normalized)
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
        : "border-stone-200 bg-stone-50 text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300";

  return (
    <span className={cnx("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize", tone)}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {status || "unknown"}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-8 text-center dark:border-stone-800 dark:bg-stone-950">
      <h3 className="text-sm font-semibold text-stone-900 dark:text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-stone-500 dark:text-stone-500">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
