import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ScanLine } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MacroBar } from "@/components/MacroBar";
import { allergiesQuery, analysesQuery, profileQuery, todayKey } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — VitaVision" },
      {
        name: "description",
        content: "Today's calories, macros, weekly intake and recent food scans at a glance.",
      },
      { property: "og:title", content: "Dashboard — VitaVision" },
      {
        property: "og:description",
        content: "Today's calories, macros, weekly intake and recent food scans at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { data: profile } = useQuery(profileQuery(userId));
  const { data: analyses, isPending } = useQuery(analysesQuery(userId));
  const { data: allergies } = useQuery(allergiesQuery(userId));

  const today = todayKey();
  const logged = (analyses ?? []).filter((a) => a.logged);
  const todays = logged.filter((a) => a.created_at.slice(0, 10) === today);

  const totals = todays.reduce(
    (acc, a) => ({
      calories: acc.calories + a.calories,
      protein: acc.protein + a.protein,
      carbs: acc.carbs + a.carbs,
      fat: acc.fat + a.fat,
      fiber: acc.fiber + a.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const calories = logged
      .filter((a) => a.created_at.slice(0, 10) === key)
      .reduce((sum, a) => sum + a.calories, 0);
    return { day: d.toLocaleDateString(undefined, { weekday: "short" }), calories };
  });

  const recentWarnings = (analyses ?? [])
    .slice(0, 10)
    .flatMap((a) => (a.allergy_warnings ?? []).map((w) => ({ ...w, id: a.id })));

  if (isPending) return <p className="text-sm text-muted-foreground">Loading your day…</p>;

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            Hello{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {todays.length
              ? `${todays.length} meal${todays.length > 1 ? "s" : ""} logged today.`
              : "No meals logged today yet."}
          </p>
        </div>
        <Link
          to="/analyze"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground ring-1 ring-primary/40 transition-transform hover:-translate-y-0.5"
        >
          <ScanLine className="size-4" aria-hidden="true" /> Analyze food
        </Link>
      </header>

      {recentWarnings.length > 0 ? (
        <div className="rounded-2xl border border-rose/30 bg-rose/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-rose">
            <AlertTriangle className="size-4" aria-hidden="true" /> Allergy warnings in recent scans
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {recentWarnings.slice(0, 4).map((w, i) => (
              <li key={i}>
                <span className="text-foreground">{w.food_name}</span> — {w.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-12">
        <div className="rounded-2xl glass-solid p-5 lg:col-span-5">
          <h2 className="text-sm font-medium">Today against your targets</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Targets are estimates from your profile.
          </p>
          <div className="mt-5 space-y-4">
            <MacroBar
              label="Calories"
              value={Math.round(totals.calories)}
              target={profile?.calorie_target ?? 2000}
              unit="kcal"
              tone="primary"
            />
            <MacroBar
              label="Protein"
              value={Math.round(totals.protein)}
              target={profile?.protein_target ?? 90}
              unit="g"
              tone="sky"
            />
            <MacroBar
              label="Carbs"
              value={Math.round(totals.carbs)}
              target={profile?.carb_target ?? 240}
              unit="g"
              tone="amber"
            />
            <MacroBar
              label="Fat"
              value={Math.round(totals.fat)}
              target={profile?.fat_target ?? 65}
              unit="g"
              tone="rose"
            />
            <MacroBar
              label="Fiber"
              value={Math.round(totals.fiber)}
              target={profile?.fiber_target ?? 28}
              unit="g"
              tone="primary"
            />
          </div>
        </div>

        <div className="rounded-2xl glass-solid p-5 lg:col-span-7">
          <h2 className="text-sm font-medium">Calories, last 7 days</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={week}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.45)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.45)" fontSize={11} tickLine={false} axisLine={false} width={38} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    background: "rgba(16,20,24,0.95)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="calories" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-2xl glass-solid p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent scans</h2>
          <Link to="/history" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        {(analyses ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nothing scanned yet. Take a photo of your next meal to get started.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {(analyses ?? []).slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <Link
                    to="/result/$id"
                    params={{ id: a.id }}
                    className="truncate text-sm hover:text-primary"
                  >
                    {a.meal_type} · {Math.round(a.calories)} kcal
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()} · {Math.round(a.total_weight_g)} g
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-xs ${
                    a.logged ? "bg-primary/15 text-primary" : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {a.logged ? "Logged" : "Not logged"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
