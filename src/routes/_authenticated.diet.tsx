import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generateRecommendations } from "@/lib/diet-engine";
import {
  allergiesQuery,
  analysesQuery,
  foodsQuery,
  profileQuery,
  recommendationsQuery,
  todayKey,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/diet")({
  head: () => ({
    meta: [
      { title: "Your diet plan — VitaVision" },
      {
        name: "description",
        content:
          "Personalized meal suggestions built from your goal, remaining calories, allergies and food preferences.",
      },
      { property: "og:title", content: "Your diet plan — VitaVision" },
      {
        property: "og:description",
        content:
          "Personalized meal suggestions built from your goal, remaining calories, allergies and food preferences.",
      },
    ],
  }),
  component: DietPage,
});

function DietPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const day = todayKey();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: profile } = useQuery(profileQuery(userId));
  const { data: foods } = useQuery(foodsQuery());
  const { data: allergies } = useQuery(allergiesQuery(userId));
  const { data: analyses } = useQuery(analysesQuery(userId));
  const { data: saved, isPending } = useQuery(recommendationsQuery(userId, day));

  const consumed = useMemo(() => {
    const todays = (analyses ?? []).filter((a) => a.logged && a.created_at.slice(0, 10) === day);
    return todays.reduce(
      (acc, a) => ({
        calories: acc.calories + a.calories,
        protein: acc.protein + a.protein,
        carbs: acc.carbs + a.carbs,
        fat: acc.fat + a.fat,
        fiber: acc.fiber + a.fiber,
        sugar: acc.sugar + a.sugar,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
    );
  }, [analyses, day]);

  const engine = useMemo(() => {
    if (!profile || !foods) return null;
    return generateRecommendations({
      goal: profile.goal,
      diet: profile.diet_preference,
      allergies: (allergies ?? []).map((a) => a.name),
      likes: profile.likes ?? [],
      dislikes: profile.dislikes ?? [],
      avoids: profile.avoids ?? [],
      targets: {
        calories: profile.calorie_target,
        protein: profile.protein_target,
        fiber: profile.fiber_target,
      },
      consumed,
      recentFoods: [],
      foods,
    });
  }, [profile, foods, allergies, consumed]);

  async function savePlan() {
    if (!engine || !userId) return;
    setBusy(true);
    await supabase.from("diet_recommendations").delete().eq("user_id", userId).eq("day", day);
    const { error } = await supabase.from("diet_recommendations").insert(
      engine.recommendations.map((r) => ({
        user_id: userId,
        day,
        meal: r.meal,
        title: r.title,
        items: r.items,
        calories: r.calories,
        protein: r.protein,
        rationale: r.rationale,
      })),
    );
    setBusy(false);
    if (error) {
      toast.error("Could not save today's plan.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["recommendations", userId, day] });
    toast.success("Plan saved for today");
  }

  if (isPending || !engine) {
    return <p className="text-sm text-muted-foreground">Building your plan…</p>;
  }

  const list = (saved ?? []).length ? saved! : engine.recommendations;
  const remaining = Math.max(0, (profile?.calorie_target ?? 0) - consumed.calories);

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Your diet plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {Math.round(remaining)} kcal left today · built around your goal, allergies and
            preferences.
          </p>
        </div>
        <button
          onClick={savePlan}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground ring-1 ring-primary/40 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          {busy ? "Saving…" : "Save today's plan"}
        </button>
      </header>

      {engine.notes.length > 0 ? (
        <div className="rounded-2xl border border-amber/30 bg-amber/10 p-4 text-xs text-muted-foreground">
          <ul className="space-y-1">
            {engine.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {list.map((r, i) => (
          <article key={("id" in r && r.id) || i} className="rounded-2xl glass-solid p-5">
            <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">{r.meal}</p>
            <h2 className="mt-2 text-base font-medium">{r.title}</h2>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {r.items.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              ~{Math.round(r.calories)} kcal · {Math.round(r.protein)} g protein
            </p>
            <p className="mt-2 text-xs leading-relaxed text-pretty text-muted-foreground/80">
              {r.rationale}
            </p>
          </article>
        ))}
      </section>

      {engine.limit.length > 0 ? (
        <section className="rounded-2xl glass p-5">
          <h2 className="text-sm font-medium">Foods to limit for your goal</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {engine.limit.map((l) => (
              <span
                key={l}
                className="rounded-md border border-border bg-white/5 px-2 py-1 text-xs text-muted-foreground"
              >
                {l}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Suggestions are generated from a fixed nutrition library using transparent rules — they never
        include a food that conflicts with your stored allergies or diet preference. Not medical
        advice.
      </p>
    </div>
  );
}
