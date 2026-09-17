import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TagInput } from "./TagInput";
import { AppSelect } from "./AppSelect";
import {
  ACTIVITY_LEVELS,
  COMMON_ALLERGENS,
  DIETS,
  GOALS,
  computeTargets,
} from "@/lib/nutrition";
import type { Profile } from "@/lib/queries";

const inputClass =
  "w-full rounded-lg border border-input bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/30";

export type ProfileDraft = {
  name: string;
  age: string;
  height_cm: string;
  weight_kg: string;
  gender: string;
  activity_level: string;
  meal_frequency: string;
  water_target_l: string;
  goal: string;
  diet_preference: string;
  likes: string[];
  dislikes: string[];
  avoids: string[];
  allergies: string[];
};

export function draftFromProfile(profile: Profile | null, allergies: string[]): ProfileDraft {
  return {
    name: profile?.name ?? "",
    age: profile?.age ? String(profile.age) : "",
    height_cm: profile?.height_cm ? String(profile.height_cm) : "",
    weight_kg: profile?.weight_kg ? String(profile.weight_kg) : "",
    gender: profile?.gender ?? "unspecified",
    activity_level: profile?.activity_level ?? "moderate",
    meal_frequency: String(profile?.meal_frequency ?? 3),
    water_target_l: String(profile?.water_target_l ?? 2.5),
    goal: profile?.goal ?? "healthy_eating",
    diet_preference: profile?.diet_preference ?? "none",
    likes: profile?.likes ?? [],
    dislikes: profile?.dislikes ?? [],
    avoids: profile?.avoids ?? [],
    allergies,
  };
}

export function ProfileForm({
  userId,
  initial,
  submitLabel,
  onSaved,
}: {
  userId: string;
  initial: ProfileDraft;
  submitLabel: string;
  onSaved?: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const set = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const targets = computeTargets({
    age: draft.age ? Number(draft.age) : null,
    height_cm: draft.height_cm ? Number(draft.height_cm) : null,
    weight_kg: draft.weight_kg ? Number(draft.weight_kg) : null,
    gender: draft.gender,
    activity_level: draft.activity_level,
    goal: draft.goal,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (draft.name.trim().length < 2) return setError("Please enter your name.");
    const age = Number(draft.age);
    if (!age || age < 13 || age > 100) return setError("Enter an age between 13 and 100.");
    const height = Number(draft.height_cm);
    if (!height || height < 100 || height > 250) return setError("Enter a height in cm (100–250).");
    const weight = Number(draft.weight_kg);
    if (!weight || weight < 30 || weight > 300) return setError("Enter a weight in kg (30–300).");

    setBusy(true);
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: draft.name.trim(),
        age,
        height_cm: height,
        weight_kg: weight,
        gender: draft.gender,
        activity_level: draft.activity_level,
        meal_frequency: Number(draft.meal_frequency) || 3,
        water_target_l: Number(draft.water_target_l) || 2.5,
        goal: draft.goal,
        diet_preference: draft.diet_preference,
        likes: draft.likes,
        dislikes: draft.dislikes,
        avoids: draft.avoids,
        calorie_target: targets.calories,
        protein_target: targets.protein,
        carb_target: targets.carbs,
        fat_target: targets.fat,
        fiber_target: targets.fiber,
        onboarded: true,
      })
      .eq("id", userId);

    if (profileError) {
      setBusy(false);
      setError("We couldn't save your profile. Please try again.");
      return;
    }

    await supabase.from("allergies").delete().eq("user_id", userId);
    if (draft.allergies.length) {
      await supabase
        .from("allergies")
        .insert(draft.allergies.map((name) => ({ user_id: userId, name })));
    }

    await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    await queryClient.invalidateQueries({ queryKey: ["allergies", userId] });
    setBusy(false);
    toast.success("Profile saved");
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <section className="rounded-2xl glass p-5">
        <h2 className="text-sm font-medium">About you</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <input
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Age</span>
            <input
              type="number"
              value={draft.age}
              onChange={(e) => set("age", e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Height (cm)</span>
            <input
              type="number"
              value={draft.height_cm}
              onChange={(e) => set("height_cm", e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Weight (kg)</span>
            <input
              type="number"
              value={draft.weight_kg}
              onChange={(e) => set("weight_kg", e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
          <div className="block">
            <span className="text-xs font-medium text-muted-foreground">Gender</span>
            <AppSelect
              id="profile-gender"
              value={draft.gender}
              onValueChange={(value) => set("gender", value)}
              options={[
                { value: "unspecified", label: "Prefer not to say" },
                { value: "female", label: "Female" },
                { value: "male", label: "Male" },
              ]}
              className="mt-1.5"
            />
          </div>
          <div className="block">
            <span className="text-xs font-medium text-muted-foreground">Activity level</span>
            <AppSelect
              id="profile-activity"
              value={draft.activity_level}
              onValueChange={(value) => set("activity_level", value)}
              options={ACTIVITY_LEVELS}
              className="mt-1.5"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl glass p-5">
        <h2 className="text-sm font-medium">Goal &amp; routine</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="block">
            <span className="text-xs font-medium text-muted-foreground">Goal</span>
            <AppSelect
              id="profile-goal"
              value={draft.goal}
              onValueChange={(value) => set("goal", value)}
              options={GOALS}
              className="mt-1.5"
            />
          </div>
          <div className="block">
            <span className="text-xs font-medium text-muted-foreground">Diet preference</span>
            <AppSelect
              id="profile-diet"
              value={draft.diet_preference}
              onValueChange={(value) => set("diet_preference", value)}
              options={DIETS}
              className="mt-1.5"
            />
          </div>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Meals per day</span>
            <input
              type="number"
              min={1}
              max={8}
              value={draft.meal_frequency}
              onChange={(e) => set("meal_frequency", e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Water target (litres)</span>
            <input
              type="number"
              step="0.1"
              value={draft.water_target_l}
              onChange={(e) => set("water_target_l", e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl glass p-5">
        <h2 className="text-sm font-medium">Allergies &amp; food preferences</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Allergy matching is a preference aid based on what you list here — it is not a guarantee
          that a food is allergen-free.
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <TagInput
            id="allergies"
            label="Allergies"
            values={draft.allergies}
            onChange={(v) => set("allergies", v)}
            suggestions={COMMON_ALLERGENS}
          />
          <TagInput
            id="avoids"
            label="Foods to avoid"
            hint="Never recommended to you."
            values={draft.avoids}
            onChange={(v) => set("avoids", v)}
          />
          <TagInput
            id="likes"
            label="Foods you like"
            values={draft.likes}
            onChange={(v) => set("likes", v)}
          />
          <TagInput
            id="dislikes"
            label="Foods you dislike"
            values={draft.dislikes}
            onChange={(v) => set("dislikes", v)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-5">
        <h2 className="text-sm font-medium text-primary">Your estimated daily targets</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Calculated with the Mifflin–St Jeor equation from the numbers above. Estimates, not
          medical advice.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Calories", `${targets.calories} kcal`],
            ["Protein", `${targets.protein} g`],
            ["Carbs", `${targets.carbs} g`],
            ["Fat", `${targets.fat} g`],
            ["Fiber", `${targets.fiber} g`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-white/5 p-3">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-1 font-display text-lg">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {error ? (
        <p role="alert" className="text-sm text-rose">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground ring-1 ring-primary/40 transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
      >
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
