import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  imageBase64: z.string().min(100, "Image data is missing."),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/, "Unsupported image type."),
  candidates: z.array(z.string()).max(400),
});

export type DetectionResult = {
  items: {
    food_name: string;
    confidence: number;
    quantity: number;
    bounding_box: { x1: number; y1: number; x2: number; y2: number } | null;
  }[];
  model: string;
};

const MODEL = "google/gemini-3.8-flash";

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("The AI response could not be read.");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

export const detectFoodItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<DetectionResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Error("AI detection is not configured on this project.");
    }

    const approxBytes = (data.imageBase64.length * 3) / 4;
    if (approxBytes > 8 * 1024 * 1024) {
      throw new Error("That image is larger than 8 MB. Please use a smaller photo.");
    }

    const vocabulary = data.candidates.slice(0, 200).join(", ");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a food recognition system. Identify every distinct edible item visible in the photo, count how many of each are present, and return a tight bounding box for each item group. " +
              "Use singular, lowercase, generic food names. Prefer names from this list when they fit: " +
              vocabulary +
              ". If an item is not in the list, still report the best generic name. " +
              "Confidence must be your honest probability between 0 and 1. If the photo contains no food, return an empty items array. " +
              'Reply with JSON only: {"items":[{"food_name":string,"confidence":number,"quantity":integer,"bounding_box":{"x1":number,"y1":number,"x2":number,"y2":number}}]} ' +
              "where bounding box values are fractions of image width/height between 0 and 1.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this food photo." },
              {
                type: "image_url",
                image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) {
        throw new Error("The AI service is busy right now. Please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("AI usage credits are exhausted for this workspace. Add credits to keep analyzing photos.");
      }
      console.error("AI gateway error", response.status, body);
      throw new Error("Food detection is unavailable right now. Please try again later.");
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(content) as { items?: unknown };

    const raw = Array.isArray(parsed.items) ? parsed.items : [];
    const items: DetectionResult["items"] = raw
      .map((entry) => {
        const e = entry as Record<string, unknown>;
        const box = e["bounding_box"] as Record<string, unknown> | undefined;
        const num = (v: unknown, fallback = 0) =>
          typeof v === "number" && Number.isFinite(v) ? v : fallback;
        return {
          food_name: String(e["food_name"] ?? "").trim().toLowerCase(),
          confidence: Math.min(1, Math.max(0, num(e["confidence"], 0.5))),
          quantity: Math.max(1, Math.round(num(e["quantity"], 1))),
          bounding_box: box
            ? {
                x1: Math.min(1, Math.max(0, num(box["x1"]))),
                y1: Math.min(1, Math.max(0, num(box["y1"]))),
                x2: Math.min(1, Math.max(0, num(box["x2"], 1))),
                y2: Math.min(1, Math.max(0, num(box["y2"], 1))),
              }
            : null,
        };
      })
      .filter((item) => item.food_name.length > 0);

    return { items, model: MODEL };
  });
