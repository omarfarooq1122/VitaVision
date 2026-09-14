import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { allergiesQuery, analysesQuery, profileQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — VitaVision" },
      {
        name: "description",
        content: "Manage your VitaVision account, data and privacy.",
      },
      { property: "og:title", content: "Settings — VitaVision" },
      { property: "og:description", content: "Manage your VitaVision account, data and privacy." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const userId = user?.id ?? "";
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { data: profile } = useQuery(profileQuery(userId));
  const { data: allergies } = useQuery(allergiesQuery(userId));
  const { data: analyses } = useQuery(analysesQuery(userId));

  async function exportData() {
    const payload = { profile, allergies, analyses };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vitavision-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function clearHistory() {
    if (!confirm("Delete every scan and its nutrition history? This cannot be undone.")) return;
    setBusy(true);
    await supabase.from("food_analyses").delete().eq("user_id", userId);
    setBusy(false);
    toast.success("History cleared");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Your account and your data.</p>
      </header>

      <section className="rounded-2xl glass p-5">
        <h2 className="text-sm font-medium">Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate">{user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="truncate">{profile?.name || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Daily calorie target</dt>
            <dd>{profile?.calorie_target ?? "—"} kcal</dd>
          </div>
        </dl>
        <Link to="/profile" className="mt-4 inline-block text-sm text-primary hover:underline">
          Edit profile and targets
        </Link>
      </section>

      <section className="rounded-2xl glass p-5">
        <h2 className="text-sm font-medium">Your data</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Photos and nutrition history are private to your account and stored in private storage.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={exportData}
            className="rounded-lg border border-border bg-white/5 px-4 py-2.5 text-sm"
          >
            Export my data (JSON)
          </button>
          <button
            onClick={clearHistory}
            disabled={busy}
            className="rounded-lg border border-rose/40 bg-rose/10 px-4 py-2.5 text-sm text-rose disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Delete all scans"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl glass p-5">
        <h2 className="text-sm font-medium">Session</h2>
        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/", replace: true });
          }}
          className="mt-3 rounded-lg border border-border bg-white/5 px-4 py-2.5 text-sm"
        >
          Sign out
        </button>
      </section>

      <p className="text-xs text-muted-foreground">
        VitaVision provides nutrition estimates and general guidance only. It is not a medical device
        and does not provide medical advice.
      </p>
    </div>
  );
}
