import { supabase } from "@/integrations/supabase/client";
import type { Food } from "./nutrition";

export type Profile = {
  id: string;
  name: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  gender: string | null;
  activity_level: string;
  meal_frequency: number;
  water_target_l: number;
  goal: string;
  diet_preference: string;
  likes: string[];
  dislikes: string[];
  avoids: string[];
  calorie_target: number;
  protein_target: number;
  carb_target: number;
  fat_target: number;
  fiber_target: number;
  onboarded: boolean;
};

export type Analysis = {
  id: string;
  user_id: string;
  image_path: string | null;
  meal_type: string;
  total_weight_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  allergy_warnings: { food_name: string; allergy: string; reason: string }[];
  logged: boolean;
  created_at: string;
};

export type DetectedFood = {
  id: string;
  analysis_id: string;
  food_name: string;
  confidence: number;
  quantity: number;
  bounding_box: { x1: number; y1: number; x2: number; y2: number } | null;
  est_weight_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  corrected: boolean;
};

export const profileQuery = (userId: string) => ({
  queryKey: ["profile", userId],
  queryFn: async (): Promise<Profile | null> => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    return data as Profile | null;
  },
});

export const foodsQuery = () => ({
  queryKey: ["foods"],
  staleTime: 1000 * 60 * 30,
  queryFn: async (): Promise<Food[]> => {
    const { data, error } = await supabase.from("foods").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as unknown as Food[];
  },
});

export const allergiesQuery = (userId: string) => ({
  queryKey: ["allergies", userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("allergies")
      .select("*")
      .eq("user_id", userId)
      .order("name");
    if (error) throw error;
    return (data ?? []) as { id: string; name: string }[];
  },
});

export const analysesQuery = (userId: string) => ({
  queryKey: ["analyses", userId],
  queryFn: async (): Promise<Analysis[]> => {
    const { data, error } = await supabase
      .from("food_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as unknown as Analysis[];
  },
});

export const analysisQuery = (id: string) => ({
  queryKey: ["analysis", id],
  queryFn: async () => {
    const { data, error } = await supabase.from("food_analyses").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data ?? null) as Analysis | null;
  },
});

export const detectedQuery = (analysisId: string) => ({
  queryKey: ["detected", analysisId],
  queryFn: async (): Promise<DetectedFood[]> => {
    const { data, error } = await supabase
      .from("detected_foods")
      .select("*")
      .eq("analysis_id", analysisId)
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as unknown as DetectedFood[];
  },
});

export const recommendationsQuery = (userId: string, day: string) => ({
  queryKey: ["recommendations", userId, day],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("diet_recommendations")
      .select("*")
      .eq("user_id", userId)
      .eq("day", day)
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as {
      id: string;
      meal: string;
      title: string;
      items: string[];
      calories: number;
      protein: number;
      rationale: string;
    }[];
  },
});

export async function signedImageUrl(path: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("food-images").createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function isSameDay(iso: string, day: string) {
  return new Date(iso).toISOString().slice(0, 10) === day;
}
