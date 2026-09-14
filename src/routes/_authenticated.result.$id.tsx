import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  analysisQuery,
  detectedQuery,
  foodsQuery,
  signedImageUrl,
  type DetectedFood,
} from "@/lib/queries";
import { estimateWeight, matchFood, nutrientsFor, sumNutrients } from "@/lib/nutrition";

export const Route = createFileRoute("/_authenticated/result/$id")({
  head: () => ({
    meta: [
      { title: "Scan result — VitaVision" },
      {
        name: "description",
        content: "Detected foods, confidence, estimated weight and nutrition for this meal.",
      },
      { property: "og:title", content: "Scan result — VitaVision" },
      {
        property: "og:description",
        content: "Detected foods, confidence, estimated weight and nutrition for this meal.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [correction, setCorrection] = useState("");

  const { data: analysis, isPending } = useQuery(analysisQuery(id));
  const { data: items } = useQuery(detectedQuery(id));
  const { data: foods } = useQuery(foodsQuery());

  useEffect(() => {
    let active = true;
    if (analysis?.image_path) {
      signedImageUrl(analysis.image_path).then((url) => {
        if (active) setImageUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [analysis?.image_path]);

  if (isPending) return <p className="text-sm text-muted-foreground">Loading result…</p>;
  if (!analysis) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">That analysis could not be found.</p>
        <Link to="/history" className="mt-3 inline-block text-sm text-primary hover:underline">
          Back to history
        </Link>
      </div>
    );
  }

  const list = items ?? [];
  const warnings = analysis.allergy_warnings ?? [];

  async function recalc(updated: DetectedFood[]) {
    const totals = sumNutrients(updated);
    await supabase
      .from("food_analyses")
      .update({
        total_weight_g: updated.reduce((s, r) => s + r.est_weight_g, 0),
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        fiber: totals.fiber,
        sugar: totals.sugar,
      })
      .eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["analysis", id] });
    await queryClient.invalidateQueries({ queryKey: ["detected", id] });
    if (user) await queryClient.invalidateQueries({ queryKey: ["analyses", user.id] });
  }

  async function applyCorrection(row: DetectedFood) {
    const name = correction.trim();
    if (!name) return;
    const match = matchFood(name, foods ?? []);
    const grams = estimateWeight(match, row.quantity);
    const nutrients = nutrientsFor(match, grams);
    const { error } = await supabase
      .from("detected_foods")
      .update({
        food_name: name,
        est_weight_g: grams,
        corrected: true,
        ...nutrients,
      })
      .eq("id", row.id);
    if (error) {
      toast.error("Could not save that correction.");
      return;
    }
    setEditing(null);
    setCorrection("");
    await recalc(
      list.map((r) => (r.id === row.id ? { ...r, ...nutrients, est_weight_g: grams } : r)),
    );
    toast.success("Item corrected");
  }

  async function removeItem(row: DetectedFood) {
    await supabase.from("detected_foods").delete().eq("id", row.id);
    await recalc(list.filter((r) => r.id !== row.id));
    toast.success("Item removed");
  }

  async function toggleLogged() {
    await supabase.from("food_analyses").update({ logged: !analysis!.logged }).eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["analysis", id] });
    if (user) await queryClient.invalidateQueries({ queryKey: ["analyses", user.id] });
    toast.success(analysis!.logged ? "Removed from today's log" : "Added to today's log");
  }

  async function deleteAnalysis() {
    await supabase.from("food_analyses").delete().eq("id", id);
    if (user) await queryClient.invalidateQueries({ queryKey: ["analyses", user.id] });
    toast.success("Analysis deleted");
    navigate({ to: "/history" });
  }

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight capitalize">
            {analysis.meal_type} analysis
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(analysis.created_at).toLocaleString()} · {list.length} item
            {list.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={toggleLogged}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5 ${
              analysis.logged
                ? "border border-border bg-white/5"
                : "bg-primary text-primary-foreground ring-1 ring-primary/40"
            }`}
          >
            <Check className="size-4" aria-hidden="true" />
            {analysis.logged ? "Logged" : "Log this meal"}
          </button>
          <button
            onClick={deleteAnalysis}
            aria-label="Delete analysis"
            className="rounded-lg border border-border bg-white/5 px-3 py-2.5 text-muted-foreground hover:text-rose"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {warnings.length > 0 ? (
        <div className="rounded-2xl border border-rose/30 bg-rose/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-rose">
            <AlertTriangle className="size-4" aria-hidden="true" /> Allergy warning
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {warnings.map((w, i) => (
              <li key={i}>
                <span className="text-foreground">{w.food_name}</span> — {w.reason}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground/80">
            Based on the allergies in your profile. Always check the actual ingredients.
          </p>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-12">
        <div className="rounded-2xl glass-solid p-4 lg:col-span-5">
          <div className="relative overflow-hidden rounded-xl bg-ink">
            {imageUrl ? (
              <img src={imageUrl} alt="Analyzed meal" className="w-full object-contain" />
            ) : (
              <div className="grid aspect-4/3 place-items-center text-xs text-muted-foreground">
                Image unavailable
              </div>
            )}
            {imageUrl
              ? list
                  .filter((r) => r.bounding_box)
                  .map((r) => {
                    const b = r.bounding_box!;
                    return (
                      <div
                        key={r.id}
                        className="pointer-events-none absolute rounded-md border border-primary/80"
                        style={{
                          left: `${b.x1 * 100}%`,
                          top: `${b.y1 * 100}%`,
                          width: `${Math.max(0, b.x2 - b.x1) * 100}%`,
                          height: `${Math.max(0, b.y2 - b.y1) * 100}%`,
                        }}
                      >
                        <span className="absolute -top-5 left-0 rounded bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                          {r.food_name} · {Math.round(r.confidence * 100)}%
                        </span>
                      </div>
                    );
                  })
              : null}
          </div>
        </div>

        <div className="rounded-2xl glass-solid p-5 lg:col-span-7">
          <h2 className="text-sm font-medium">Meal totals</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Calories", `${Math.round(analysis.calories)} kcal`],
              ["Weight", `${Math.round(analysis.total_weight_g)} g`],
              ["Protein", `${analysis.protein} g`],
              ["Carbs", `${analysis.carbs} g`],
              ["Fat", `${analysis.fat} g`],
              ["Fiber", `${analysis.fiber} g`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-white/5 p-3">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="mt-1 font-display text-lg">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Weights are estimated from typical portion sizes for each detected item.
          </p>
        </div>
      </section>

      <section className="rounded-2xl glass-solid p-5">
        <h2 className="text-sm font-medium">Detected items</h2>
        <ul className="mt-4 divide-y divide-border">
          {list.map((row) => (
            <li key={row.id} className="py-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {row.food_name}
                    {row.quantity > 1 ? ` × ${row.quantity}` : ""}
                    {row.corrected ? (
                      <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        corrected
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {Math.round(row.confidence * 100)}% confidence · ~{Math.round(row.est_weight_g)} g
                    · {Math.round(row.calories)} kcal · {row.protein} g protein
                  </p>
                </div>
                <div className="flex shrink-0 gap-2 text-xs">
                  <button
                    onClick={() => {
                      setEditing(editing === row.id ? null : row.id);
                      setCorrection(row.food_name);
                    }}
                    className="rounded-md border border-border bg-white/5 px-2 py-1 hover:text-primary"
                  >
                    Correct
                  </button>
                  <button
                    onClick={() => removeItem(row)}
                    className="rounded-md border border-border bg-white/5 px-2 py-1 hover:text-rose"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {editing === row.id ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    value={correction}
                    onChange={(e) => setCorrection(e.target.value)}
                    aria-label={`Correct ${row.food_name}`}
                    className="min-w-0 flex-1 rounded-lg border border-input bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                    placeholder="Correct food name"
                  />
                  <button
                    onClick={() => applyCorrection(row)}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                  >
                    Save
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
