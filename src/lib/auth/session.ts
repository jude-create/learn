import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleDashboard } from "@/lib/utils";
import type { Database, UserRole } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const profile = data as Profile | null;

  if (!profile) {
    return null;
  }

  return { user, profile };
}

export async function requireProfile(role?: UserRole) {
  const session = await getCurrentProfile();

  if (!session) {
    redirect("/login");
  }

  if (session.profile.is_suspended) {
    redirect("/login?suspended=1");
  }

  if (role && session.profile.role !== role) {
    redirect(getRoleDashboard(session.profile.role));
  }

  return session;
}
