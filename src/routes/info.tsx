import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Github,
  Mail,
  Instagram,
  Linkedin,
  ScanLine,
  Boxes,
  Scale,
  Salad,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Glow } from "@/components/Glow";
import { Brand } from "@/components/Brand";

export const Route = createFileRoute("/info")({
  head: () => ({
    meta: [
      { title: "About VitaVision — See your food. Understand your nutrition." },
      {
        name: "description",
        content:
          "VitaVision is an AI-powered nutrition platform that detects food from images, estimates weight, and gives calorie and nutrition info with allergy-aware diet suggestions.",
      },
      {
        property: "og:title",
        content: "About VitaVision — See your food. Understand your nutrition.",
      },
      {
        property: "og:description",
        content:
          "AI-powered nutrition platform: food detection, weight estimation, calorie and nutrition analysis, and personalized diet recommendations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InfoPage,
});

const CONTACTS = [
  {
    label: "GitHub",
    value: "omarfarooq1122/VitaVision",
    href: "https://github.com/omarfarooq1122/VitaVision",
    icon: Github,
  },
  {
    label: "Email",
    value: "omarfarooq122128@gmail.com",
    href: "mailto:omarfarooq122128@gmail.com",
    icon: Mail,
  },
  {
    label: "Instagram",
    value: "@omarfarooq_05",
    href: "https://instagram.com/omarfarooq_05",
    icon: Instagram,
  },
  {
    label: "LinkedIn",
    value: "Omar Farooq",
    href: "https://www.linkedin.com/in/omar-farooq-20052941b",
    icon: Linkedin,
  },
] as const;

const PIPELINE = [
  { icon: ScanLine, title: "Upload Image", body: "Start by capturing or uploading a clear photo of the food." },
  { icon: Boxes, title: "AI Detection", body: "A YOLO model detects and labels each food item in the frame." },
  { icon: Boxes, title: "Counting", body: "Multiple items are counted so the totals reflect the whole plate." },
  { icon: Scale, title: "Weight Estimation", body: "Approximate weight is estimated per item — clearly labeled as an estimate." },
  { icon: Salad, title: "Nutrition Analysis", body: "Calorie and macro values are pulled from a sourced nutrition database." },
  { icon: ShieldCheck, title: "Results", body: "Confidence, weight, macros, and allergy flags shown clearly — then saved to history." },
] as const;

const STACK = ["React", "Vite", "FastAPI", "Python", "YOLO", "PyTorch", "OpenCV"] as const;

function InfoPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Glow />
      <div className="relative mx-auto max-w-5xl px-5 py-6 sm:px-8">
        {/* Header */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 md:flex md:justify-between">
          <Brand />
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Back home
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground ring-1 ring-primary/40 transition-transform hover:-translate-y-0.5"
            >
              Open dashboard
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="mt-10 rise-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium tracking-[0.16em] text-primary uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" /> About the project
          </span>
          <h1 className="mt-6 max-w-[22ch] text-4xl leading-[1.05] font-semibold text-balance sm:text-5xl">
            VitaVision — <span className="text-primary">See your food. Understand your nutrition.</span>
          </h1>
          <p className="mt-5 max-w-[64ch] text-base leading-relaxed text-pretty text-muted-foreground">
            VitaVision is an AI-powered nutrition platform that helps users understand the food they eat through images.
            Currently focused on fruits and vegetables, VitaVision uses AI, computer vision, and nutrition data to detect
            food items, count them, estimate their approximate weight, and provide calorie and nutritional information.
          </p>
        </section>

        {/* How it works */}
        <section className="mt-12">
          <h2 className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            How it works
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PIPELINE.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="relative rounded-2xl glass p-5 transition-transform hover:-translate-y-1"
                >
                  <span className="absolute top-4 right-4 text-xs font-semibold text-muted-foreground/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Vision + technology */}
        <section className="mt-12 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl glass p-6">
            <h2 className="text-lg font-semibold">Our vision</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              VitaVision is currently designed for fruits and vegetables but is scalable to support all types of food
              in the future, making it a foundation for a complete AI-powered food and nutrition assistant.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              It also supports personalized diet suggestions and allergy-aware recommendations to make nutrition
              information more relevant to each user.
            </p>
          </div>
          <div className="rounded-2xl glass p-6">
            <h2 className="text-lg font-semibold">Technology</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Built with a modern web interface and an AI-powered backend:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {STACK.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-border bg-white/5 px-2.5 py-1 text-xs font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mt-12 mb-16">
          <h2 className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Get in touch
          </h2>
          <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
            Questions, feedback, or contributions are welcome. Reach out through any of the links below.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {CONTACTS.map((c) => {
              const Icon = c.icon;
              return (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group flex items-center gap-4 rounded-2xl glass p-5 transition-transform hover:-translate-y-1"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {c.label}
                    </div>
                    <div className="mt-0.5 truncate text-sm font-medium">{c.value}</div>
                  </div>
                </a>
              );
            })}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Built and maintained by Omar Farooq · VitaVision — See Life Clearly
          </p>
        </section>
      </div>
    </div>
  );
}
