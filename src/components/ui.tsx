import Link from "next/link";
import { clsx } from "clsx";
import { ReactNode } from "react";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const { className, variant = "primary", ...rest } = props;
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition border";
  const styles =
    variant === "primary"
      ? "bg-black text-white border-black hover:opacity-90"
      : "bg-white text-black border-gray-300 hover:bg-gray-50";
  return <button className={clsx(base, styles, className)} {...rest} />;
}

export function LinkButton({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={clsx("inline-flex items-center rounded-md px-3 py-2 text-sm font-medium border border-gray-300 hover:bg-gray-50", className)}>
      {children}
    </Link>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={clsx("w-full rounded-md border border-gray-300 px-3 py-2 text-sm", className)} {...rest} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select className={clsx("w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white", className)} {...rest} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea className={clsx("w-full rounded-md border border-gray-300 px-3 py-2 text-sm", className)} {...rest} />;
}

export function Card({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {(title || right) && (
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="text-sm font-semibold">{title}</div>
          <div>{right}</div>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
