import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { EmptyState } from "@/components/ui/empty-state";

export default async function OnboardingPage() {
  const session = await getCurrentProfile();
  if (!session) {
    redirect("/login");
  }

  if (session.profile.onboarding_completed) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: schools }, { data: departments }] = await Promise.all([
    supabase.from("schools").select("id,name").eq("is_verified", true).order("name"),
    supabase.from("departments").select("id,school_id,name").order("name")
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Set up your school profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose your primary school and department so course hubs, materials and discussions stay relevant.
      </p>
      <div className="mt-6">
        {(schools ?? []).length === 0 ? (
          <EmptyState title="No verified schools yet" description="Submit your school for admin review to continue setup." />
        ) : (
          <OnboardingForm schools={schools ?? []} departments={departments ?? []} />
        )}
      </div>
    </div>
  );
}
