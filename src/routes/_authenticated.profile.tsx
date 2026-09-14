import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ProfileForm, draftFromProfile } from "@/components/ProfileForm";
import { allergiesQuery, profileQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — VitaVision" },
      {
        name: "description",
        content: "Update your body metrics, goal, allergies and food preferences in VitaVision.",
      },
      { property: "og:title", content: "Your profile — VitaVision" },
      {
        property: "og:description",
        content: "Update your body metrics, goal, allergies and food preferences in VitaVision.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { data: profile, isPending } = useQuery(profileQuery(userId));
  const { data: allergies, isPending: allergiesPending } = useQuery(allergiesQuery(userId));

  if (isPending || allergiesPending) {
    return <p className="text-sm text-muted-foreground">Loading your profile…</p>;
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Changes here immediately update your targets, warnings and recommendations.
      </p>
      <div className="mt-6">
        <ProfileForm
          userId={userId}
          initial={draftFromProfile(profile ?? null, (allergies ?? []).map((a) => a.name))}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
