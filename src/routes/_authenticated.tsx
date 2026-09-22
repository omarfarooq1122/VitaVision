import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ScanLine,
  Salad,
  History,
  User,
  Settings as SettingsIcon,
  LogOut,
  Info,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Brand } from "@/components/Brand";
import { Glow } from "@/components/Glow";
import { profileQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analyze", label: "Analyze", icon: ScanLine },
  { to: "/diet", label: "Diet", icon: Salad },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/info", label: "About", icon: Info },
] as const;

function AuthenticatedLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

  const { data: profile } = useQuery({ ...profileQuery(user?.id ?? ""), enabled: !!user });

  useEffect(() => {
    if (profile && !profile.onboarded && pathname !== "/onboarding") {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profile, pathname, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading your account…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <Glow />
      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-8">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <Brand to="/dashboard" />
          <div className="flex items-center gap-3">
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">
              {user.email}
            </span>
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/", replace: true });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-3 py-1.5 text-xs font-medium transition-transform hover:-translate-y-0.5"
            >
              <LogOut className="size-3.5" aria-hidden="true" /> Sign out
            </button>
          </div>
        </header>

        <nav
          aria-label="Main"
          className="mt-5 flex gap-1.5 overflow-x-auto rounded-2xl glass p-1.5"
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="mt-6 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
