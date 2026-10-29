import { GuestActions } from "@/components/GuestActions";
import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { Glow } from "./Glow";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  ctaTo,
  ctaLabel,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  /** Header call-to-action for pages that already are a sign-in/register form. */
  ctaTo?: "/login" | "/register";
  ctaLabel?: string;
}) {
  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <Glow />
      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-between gap-2">
          <Brand />
          <GuestActions
            {...(ctaTo ? { signInTo: ctaTo } : {})}
            {...(ctaLabel ? { signInLabel: ctaLabel } : {})}
          />
        </div>
        <div className="mt-6 rounded-3xl glass p-7">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>
      </div>
    </div>
  );
}

export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-rose">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full min-h-11 rounded-lg border border-input bg-card/70 px-3.5 py-2.5 text-base outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/25 sm:text-sm";

export const primaryButtonClass =
  "w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground ring-1 ring-primary/40 transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60";
