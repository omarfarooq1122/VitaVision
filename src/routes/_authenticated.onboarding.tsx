import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ProfileForm, draftFromProfile } from "@/components/ProfileForm";
import { allergiesQuery, profileQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your profile — VitaVision" },
      {
        name: "description",
        content: "Tell VitaVision about your body, goal, allergies and food preferences.",
      },
      { property: "og:title", content: "Set up your profile — VitaVision" },
      {
        property: "og:description",
        content: "Tell VitaVision about your body, goal, allergies and food preferences.",
      },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id ?? "";
  const { data: profile, isPending: profilePending } = useQuery(profileQuery(userId));
  const { data: allergies, isPending: allergiesPending } = useQuery(allergiesQuery(userId));

  if (profilePending || allergiesPending) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">Set up your profile</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        This drives your calorie targets, allergy warnings and diet recommendations.
      </p>
      <div className="mt-6">
        <ProfileForm
          userId={userId}
          initial={draftFromProfile(profile ?? null, (allergies ?? []).map((a) => a.name))}
          submitLabel="Finish setup"
          onSaved={() => navigate({ to: "/dashboard" })}
        />
      </div>
    </div>
  );
}
