import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Field, inputClass, primaryButtonClass } from "./AuthCard";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function EmailOtpForm({ mode }: { mode: "signin" | "signup" }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (mode === "signup" && name.trim().length < 2) return setError("Please enter your name.");
    if (!EMAIL_RE.test(email.trim())) return setError("Please enter a valid email address.");
    setBusy(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: mode === "signup",
        emailRedirectTo: window.location.origin,
        ...(mode === "signup" ? { data: { name: name.trim() } } : {}),
      },
    });
    setBusy(false);
    if (otpError) {
      const msg = otpError.message.toLowerCase();
      setError(
        msg.includes("signups not allowed") || msg.includes("not found")
          ? "No account with that email yet. Create an account first."
          : msg.includes("rate")
            ? "Too many codes requested. Please wait a minute and try again."
            : otpError.message,
      );
      return;
    }
    setSent(true);
    setCooldown(60);
    toast.success("Code sent — check your email");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6,10}$/.test(code.trim())) return setError("Enter the code from your email.");
    setBusy(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (verifyError) {
      setError("That code is wrong or has expired. Request a new one.");
      return;
    }
    toast.success(mode === "signup" ? "Account created" : "Welcome back");
    navigate({ to: "/dashboard", replace: true });
  }

  if (!sent) {
    return (
      <form onSubmit={sendCode} className="space-y-4" noValidate>
        {mode === "signup" && (
          <Field id="otp-name" label="Name">
            <input id="otp-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your name" autoComplete="name" />
          </Field>
        )}
        <Field id="otp-email" label="Email" error={error ?? undefined}>
          <input id="otp-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
        </Field>
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "Sending code…" : "Send code"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        We sent a code to <span className="text-foreground">{email.trim()}</span>. You can also tap the link in that email.
      </p>
      <Field id="otp-code" label="Verification code" error={error ?? undefined}>
        <input
          id="otp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={10}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className={`${inputClass} text-center font-mono text-lg tracking-[0.4em]`}
          placeholder="••••••"
        />
      </Field>
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? "Verifying…" : "Verify & continue"}
      </button>
      <div className="flex justify-between text-xs">
        <button type="button" onClick={() => { setSent(false); setCode(""); setError(null); }} className="text-muted-foreground hover:text-foreground">
          Change email
        </button>
        <button type="button" disabled={cooldown > 0 || busy} onClick={() => sendCode()} className="text-primary disabled:text-muted-foreground">
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}

export function AuthMethodTabs({ value, onChange }: { value: "password" | "code"; onChange: (v: "password" | "code") => void }) {
  return (
    <div role="tablist" className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-border bg-card/50 p-1">
      {(["password", "code"] as const).map((v) => (
        <button
          key={v}
          role="tab"
          type="button"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          className={`min-h-10 rounded-lg text-sm font-medium transition-colors ${value === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {v === "password" ? "Password" : "Email code"}
        </button>
      ))}
    </div>
  );
}
