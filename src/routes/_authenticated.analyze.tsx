import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImagePlus, Loader2, RefreshCw, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { detectFoodItems } from "@/lib/detect.functions";
import { allergiesQuery, foodsQuery, profileQuery } from "@/lib/queries";
import {
  MEAL_TYPES,
  checkAllergies,
  estimateWeight,
  matchFood,
  nutrientsFor,
  sumNutrients,
} from "@/lib/nutrition";

export const Route = createFileRoute("/_authenticated/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze a meal — VitaVision" },
      {
        name: "description",
        content: "Upload a food photo and get detected items, estimated weights and nutrition.",
      },
      { property: "og:title", content: "Analyze a meal — VitaVision" },
      {
        property: "og:description",
        content: "Upload a food photo and get detected items, estimated weights and nutrition.",
      },
    ],
  }),
  component: Analyze,
});

const MAX_BYTES = 8 * 1024 * 1024;

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function Analyze() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const navigate = useNavigate();
  const detect = useServerFn(detectFoodItems);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: foods } = useQuery(foodsQuery());
  const { data: allergies } = useQuery(allergiesQuery(userId));
  const { data: profile } = useQuery(profileQuery(userId));

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mealType, setMealType] = useState<string>("lunch");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function pick(selected: File | null) {
    setError(null);
    if (!selected) return;
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(selected.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError("That image is larger than 8 MB. Please choose a smaller photo.");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function analyze() {
    if (!file || !userId) return;
    setBusy(true);
    setError(null);
    try {
      setStatus("Reading image…");
      const dataUrl = await readAsDataUrl(file);
      const base64 = dataUrl.split(",")[1] ?? "";

      setStatus("Detecting food…");
      const result = await detect({
        data: {
          imageBase64: base64,
          mimeType: file.type,
          candidates: (foods ?? []).map((f) => f.name),
        },
      });

      if (!result.items.length) {
        setBusy(false);
        setStatus("");
        setError(
          "No food could be identified in that photo. Try a clearer, well-lit shot of the plate.",
        );
        return;
      }

      setStatus("Estimating nutrition…");
      const library = foods ?? [];
      const rows = result.items.map((item) => {
        const match = matchFood(item.food_name, library);
        const grams = estimateWeight(match, item.quantity);
        const nutrients = nutrientsFor(match, grams);
        return { item, match, grams, nutrients };
      });

      const totals = sumNutrients(rows.map((r) => r.nutrients));
      const warnings = checkAllergies(
        rows.map((r) => ({ name: r.item.food_name, food: r.match })),
        (allergies ?? []).map((a) => a.name),
      );

      setStatus("Saving image…");
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("food-images")
        .upload(path, file, { contentType: file.type });

      setStatus("Recording analysis…");
      const { data: analysis, error: insertError } = await supabase
        .from("food_analyses")
        .insert({
          user_id: userId,
          image_path: uploadError ? null : path,
          meal_type: mealType,
          mode: "image",
          total_weight_g: rows.reduce((s, r) => s + r.grams, 0),
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          fiber: totals.fiber,
          sugar: totals.sugar,
          allergy_warnings: warnings,
          logged: false,
        })
        .select("id")
        .single();

      if (insertError || !analysis) throw new Error("Could not save this analysis.");

      const { error: detailError } = await supabase.from("detected_foods").insert(
        rows.map((r) => ({
          analysis_id: analysis.id,
          user_id: userId,
          food_name: r.item.food_name,
          confidence: r.item.confidence,
          quantity: r.item.quantity,
          bounding_box: r.item.bounding_box,
          est_weight_g: r.grams,
          calories: r.nutrients.calories,
          protein: r.nutrients.protein,
          carbs: r.nutrients.carbs,
          fat: r.nutrients.fat,
          fiber: r.nutrients.fiber,
          sugar: r.nutrients.sugar,
        })),
      );
      if (detailError) throw new Error("Could not save the detected items.");

      toast.success(`Detected ${rows.length} item${rows.length > 1 ? "s" : ""}`);
      navigate({ to: "/result/$id", params: { id: analysis.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong analyzing that photo.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Analyze a meal</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Photograph the plate from above in good light. Weights are estimates from typical portion
          sizes, not measurements.
        </p>
      </header>

      <section className="rounded-2xl glass p-5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="meal">
          Meal
        </label>
        <select
          id="meal"
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="mt-1.5 w-full max-w-xs rounded-lg border border-input bg-white/5 px-3 py-2.5 text-sm capitalize outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
        >
          {MEAL_TYPES.map((m) => (
            <option key={m} value={m} className="capitalize">
              {m}
            </option>
          ))}
        </select>

        <div className="mt-5">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          {preview ? (
            <div className="relative overflow-hidden rounded-xl border border-border">
              <img src={preview} alt="Selected meal" className="max-h-96 w-full object-contain bg-ink" />
              {busy ? (
                <div className="scanline absolute inset-x-0 top-0 h-14 bg-linear-to-b from-primary/40 to-transparent" />
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="grid w-full place-items-center gap-2 rounded-xl border border-dashed border-border bg-white/[0.03] py-14 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <ImagePlus className="size-6" aria-hidden="true" />
              Choose a food photo (JPG, PNG or WebP, up to 8 MB)
            </button>
          )}
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-sm text-rose">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={analyze}
            disabled={!file || busy}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground ring-1 ring-primary/40 transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {busy ? status || "Analyzing…" : "Analyze photo"}
          </button>
          {file ? (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              disabled={busy}
              className="rounded-lg border border-border bg-white/5 px-4 py-2.5 text-sm disabled:opacity-60"
            >
              Choose another
            </button>
          ) : null}
        </div>
      </section>

      {profile && !profile.onboarded ? null : (
        <p className="text-xs text-muted-foreground">
          Detected foods are matched against the {(allergies ?? []).length} allergy entr
          {(allergies ?? []).length === 1 ? "y" : "ies"} in your profile. This is a preference aid,
          not a guarantee that a food is allergen-free.
        </p>
      )}
    </div>
  );
}
