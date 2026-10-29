import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";

const aboutClass =
  "inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground";
const signInPrimary =
  "inline-flex shrink-0 items-center rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground ring-1 ring-primary/40 transition-transform hover:-translate-y-0.5 sm:px-3.5 sm:text-sm";
const signInSecondary =
  "inline-flex shrink-0 items-center rounded-lg border border-border bg-foreground/5 px-3 py-2 text-xs font-medium transition-transform hover:-translate-y-0.5 sm:px-3.5 sm:text-sm";
const dashboardClass =
  "hidden shrink-0 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground ring-1 ring-primary/40 transition-transform hover:-translate-y-0.5 sm:inline-flex";

/**
 * Constant action bar for signed-out pages: About, theme toggle and Sign in.
 * `showDashboard` adds the register CTA (then Sign in renders secondary).
 */
export function GuestActions({
  signInTo = "/login",
  signInLabel = "Sign in",
  showAbout = true,
  aboutClass: aboutExtra = "",
  showDashboard = false,
}: {
  signInTo?: "/login" | "/register";
  signInLabel?: string;
  showAbout?: boolean;
  aboutClass?: string;
  showDashboard?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
      {showAbout ? (
        <Link to="/info" aria-label="About VitaVision" className={`${aboutClass} ${aboutExtra}`}>
          About
        </Link>
      ) : null}
      <ThemeToggle />
      <Link to={signInTo} className={showDashboard ? signInSecondary : signInPrimary}>
        {signInLabel}
      </Link>
      {showDashboard ? (
        <Link to="/register" className={dashboardClass}>
          Open dashboard
        </Link>
      ) : null}
    </div>
  );
}
