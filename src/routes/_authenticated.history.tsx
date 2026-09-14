import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { analysesQuery } from "@/lib/queries";
import { MEAL_TYPES } from "@/lib/nutrition";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — VitaVision" },
      { name: "description", content: "Every meal you have scanned, with nutrition and totals." },
      { property: "og:title", content: "History — VitaVision" },
      {
        property: "og:description",
        content: "Every meal you have scanned, with nutrition and totals.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = useAuth();
  const { data: analyses, isPending } = useQuery(analysesQuery(user?.id ?? ""));
  const [meal, setMeal] = useState("all");

  const rows = (analyses ?? []).filter((a) => meal === "all" || a.meal_type === meal);
  const grouped = rows.reduce<Record<string, typeof rows>>((acc, a) => {
    const key = new Date(a.created_at).toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  if (isPending) return <p className="text-sm text-muted-foreground">Loading history…</p>;

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} scan{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <select
          value={meal}
          onChange={(e) => setMeal(e.target.value)}
          aria-label="Filter by meal"
          className="shrink-0 rounded-lg border border-input bg-white/5 px-3 py-2 text-sm capitalize outline-none focus:border-primary/60"
        >
          <option value="all">All meals</option>
          {MEAL_TYPES.map((m) => (
            <option key={m} value={m} className="capitalize">
              {m}
            </option>
          ))}
        </select>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl glass p-8 text-center">
          <p className="text-sm text-muted-foreground">No scans yet.</p>
          <Link
            to="/analyze"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Analyze your first meal
          </Link>
        </div>
      ) : (
        Object.entries(grouped).map(([day, dayRows]) => (
          <section key={day} className="rounded-2xl glass-solid p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">{day}</h2>
              <span className="text-xs text-muted-foreground">
                {Math.round(
                  dayRows.filter((r) => r.logged).reduce((s, r) => s + r.calories, 0),
                )}{" "}
                kcal logged
              </span>
            </div>
            <ul className="mt-3 divide-y divide-border">
              {dayRows.map((a) => (
                <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      to="/result/$id"
                      params={{ id: a.id }}
                      className="text-sm capitalize hover:text-primary"
                    >
                      {a.meal_type}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {Math.round(a.calories)} kcal · {a.protein} g protein · {a.carbs} g carbs ·{" "}
                      {a.fat} g fat
                    </p>
                    {(a.allergy_warnings ?? []).length > 0 ? (
                      <p className="mt-1 text-xs text-rose">
                        {a.allergy_warnings.length} allergy warning
                        {a.allergy_warnings.length === 1 ? "" : "s"}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`h-fit shrink-0 rounded-md px-2 py-0.5 text-xs ${
                      a.logged ? "bg-primary/15 text-primary" : "bg-white/5 text-muted-foreground"
                    }`}
                  >
                    {a.logged ? "Logged" : "Not logged"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
