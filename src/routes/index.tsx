import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ScanLine } from "lucide-react";
import { Glow } from "@/components/Glow";
import { Brand } from "@/components/Brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VitaVision — Understand your food. Personalize your nutrition." },
      {
        name: "description",
        content:
          "VitaVision reads a food photo into detected items, estimated weight, nutrition totals, allergy flags and a diet plan built around your profile.",
      },
      {
        property: "og:title",
        content: "VitaVision — Understand your food. Personalize your nutrition.",
      },
      {
        property: "og:description",
        content:
          "AI food detection, estimated weights, nutrition totals and allergy-aware diet recommendations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    n: "01",
    title: "Capture",
    body: "Photograph the plate under clean light. No cropping, no fuss — the framing does the weighing.",
  },
  {
    n: "02",
    title: "Detect & label",
    body: "Every item is boxed, counted, and scored. Confidence and estimated weight stay visible, never hidden.",
  },
  {
    n: "03",
    title: "Personalize",
    body: "Nutrition totals, allergy flags, and daily targets fold into a recommendation built for you.",
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Glow />
      <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 md:flex md:justify-between">
          <Brand />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#report" className="transition-colors hover:text-foreground">
              Inspection report
            </a>
            <a href="#privacy" className="transition-colors hover:text-foreground">
              Privacy
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground ring-1 ring-primary/40 transition-transform hover:-translate-y-0.5"
            >
              Open dashboard
            </Link>
          </div>
        </header>

        <section className="relative mt-10 md:mt-16">
          <div className="relative rounded-3xl glass p-8 shadow-2xl sm:p-12">
            <div className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
            <div className="grid items-center gap-10 md:grid-cols-12">
              <div className="md:col-span-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium tracking-[0.16em] text-primary uppercase">
                  <span className="size-1.5 rounded-full bg-primary" /> AI nutrition platform
                </span>
                <h1 className="mt-6 max-w-[24ch] text-4xl leading-[1.02] font-semibold text-balance sm:text-5xl md:text-6xl">
                  Understand your food. Personalize your <span className="text-primary">nutrition.</span>
                </h1>
                <p className="mt-5 max-w-[48ch] text-base leading-relaxed text-pretty text-muted-foreground">
                  Point a camera at the plate. VitaVision detects the food, estimates the weight, and
                  shows exactly what is in front of you — confidence scores, nutrition totals, and
                  allergy flags, clearly.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    to="/register"
                    className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground ring-1 ring-primary/40 transition-transform hover:-translate-y-0.5"
                  >
                    Start a scan
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-lg border border-border bg-white/5 px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
                  >
                    I already have an account
                  </Link>
                </div>
                <div className="mt-8 flex flex-wrap gap-2.5 text-xs text-muted-foreground">
                  <span className="rounded-md border border-border bg-white/5 px-2.5 py-1">
                    Confidence shown per item
                  </span>
                  <span className="rounded-md border border-border bg-white/5 px-2.5 py-1">
                    Est. weight per item
                  </span>
                  <span className="rounded-md border border-border bg-white/5 px-2.5 py-1">
                    Allergy-aware
                  </span>
                </div>
              </div>
              <div className="md:col-span-5">
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card/90 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3">
                    <div>
                      <p className="text-[9px] font-semibold tracking-[0.16em] text-primary uppercase">
                        Active analysis
                      </p>
                      <h3 className="mt-0.5 text-sm font-semibold">Plate inspection</h3>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[9px] text-muted-foreground">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                        <span className="relative inline-flex size-2 rounded-full bg-primary" />
                      </span>
                      LIVE FEED
                    </div>
                  </div>

                  <div className="relative aspect-4/3 overflow-hidden bg-ink">
                    <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:24px_24px]" />
                    <div className="absolute top-[12%] left-[21%] size-[62%] rounded-full border border-border bg-card/60 shadow-[inset_0_0_35px_color-mix(in_oklab,var(--primary)_10%,transparent)]">
                      <div className="absolute top-[17%] left-[16%] h-[42%] w-[30%] rotate-12 rounded-[55%_45%_55%_45%] bg-primary/25 ring-1 ring-primary/50" />
                      <div className="absolute top-[20%] right-[13%] size-[34%] rounded-full bg-sky/20 ring-1 ring-sky/50" />
                      <div className="absolute right-[24%] bottom-[14%] h-[20%] w-[42%] rounded-full bg-amber/20 ring-1 ring-amber/50" />
                    </div>

                    <div className="scanline absolute inset-x-0 top-0 z-10 h-10 bg-linear-to-b from-primary/35 to-transparent" />
                    <div className="absolute top-[17%] left-[12%] rounded-md border border-primary bg-ink/80 px-1.5 py-0.5 font-mono text-[9px] font-medium text-primary backdrop-blur-sm">
                      Banana · 96%
                    </div>
                    <div className="absolute top-[43%] right-[8%] rounded-md border border-sky bg-ink/80 px-1.5 py-0.5 font-mono text-[9px] font-medium text-sky backdrop-blur-sm">
                      Oats · 88%
                    </div>
                    <div className="absolute bottom-[12%] left-[25%] rounded-md border border-amber bg-ink/80 px-1.5 py-0.5 font-mono text-[9px] font-medium text-amber backdrop-blur-sm">
                      Almond · 91%
                    </div>
                  </div>

                  <div className="grid grid-cols-3 border-t border-border">
                    <div className="border-r border-border px-3 py-2.5">
                      <p className="text-[9px] uppercase text-muted-foreground">Items</p>
                      <p className="mt-0.5 font-mono text-sm font-medium">03</p>
                    </div>
                    <div className="border-r border-border px-3 py-2.5">
                      <p className="text-[9px] uppercase text-muted-foreground">Top score</p>
                      <p className="mt-0.5 font-mono text-sm font-medium">96%</p>
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-[9px] uppercase text-muted-foreground">Status</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-primary">
                        <Check className="size-3" aria-hidden="true" /> Ready
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-t border-border bg-background/30 px-4 py-2.5 text-[10px] text-muted-foreground">
                    <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary">
                      <ScanLine className="size-3.5" aria-hidden="true" />
                    </span>
                    Confidence is shown for every detected item
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="mt-10">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
            <span className="text-xs text-muted-foreground">Three steps, one plate</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl glass p-5">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/15 font-display text-primary">
                  {s.n}
                </span>
                <h3 className="mt-4 text-base font-medium">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="report" className="mt-10 grid gap-4 lg:grid-cols-12">
          <div className="rounded-2xl glass-solid p-5 lg:col-span-3">
            <p className="text-xs text-muted-foreground">Every scan returns</p>
            <p className="mt-4 font-display text-sm font-medium">Detected items and counts</p>
            <p className="mt-1 text-xs text-muted-foreground">
              With a confidence score you can always see, and a correction control when the model gets
              it wrong.
            </p>
            <div className="mt-6 rounded-xl border border-rose/30 bg-rose/10 p-3">
              <p className="text-xs font-medium text-rose">Allergy watch</p>
              <p className="mt-1 text-xs leading-relaxed text-pretty text-muted-foreground">
                Detected foods are matched against the allergies stored in your profile and flagged
                before you eat.
              </p>
            </div>
          </div>

          <div className="rounded-2xl glass-solid p-5 lg:col-span-4">
            <p className="font-display text-sm font-medium">Daily targets</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Calories and macros tracked against an estimate from your own body metrics and goal.
            </p>
            <div className="mt-4 space-y-3.5">
              {[
                { label: "Calories", w: "72%", tone: "bg-primary" },
                { label: "Protein", w: "58%", tone: "bg-sky" },
                { label: "Carbs", w: "64%", tone: "bg-amber" },
                { label: "Fiber", w: "48%", tone: "bg-rose" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-muted-foreground">tracked daily</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${row.tone}`} style={{ width: row.w }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl glass-solid p-5 lg:col-span-5">
            <p className="font-display text-sm font-medium">Weekly intake</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Seven days of logged meals, charted so patterns are obvious.
            </p>
            <div className="mt-5 flex h-36 items-end gap-2">
              {[72, 88, 64, 95, 58, 80, 40].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-md bg-primary/70"
                    style={{ height: `${h}%` }}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {["M", "T", "W", "T", "F", "S", "S"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl glass-solid p-5 lg:col-span-4">
            <p className="font-display text-sm font-medium">Personalized diet</p>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
              Breakfast, lunch, snack and dinner suggestions built from your goal, remaining calories,
              protein gap, diet preference and food likes. Foods that conflict with a stored allergy
              are never suggested.
            </p>
          </div>

          <div id="privacy" className="rounded-2xl glass-solid p-5 lg:col-span-3">
            <p className="font-display text-sm font-medium">Privacy</p>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
              Your photos, allergies and nutrition history are private to your account. Images are
              stored in private storage and only your session can open them.
            </p>
          </div>

          <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-5 lg:col-span-5">
            <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
              Start free
            </p>
            <p className="mt-3 text-sm leading-relaxed text-pretty">
              Create an account, answer a short onboarding, and scan your first plate in under two
              minutes.
            </p>
            <Link
              to="/register"
              className="mt-4 inline-block rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-transform hover:-translate-y-0.5"
            >
              Create your account
            </Link>
          </div>
        </section>

        <footer className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>VitaVision</span>
          <p className="max-w-[52ch]">
            Nutrition values and weights are estimates from image analysis, not measurements. Allergy
            flags are a preference-matching aid, not a guarantee, and nothing here is medical advice.
          </p>
        </footer>
      </div>
    </div>
  );
}
