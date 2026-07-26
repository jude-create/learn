import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { getRoleDashboard } from "@/lib/utils";

export default async function DashboardRedirectPage() {
  const { profile } = await requireProfile();
  redirect(getRoleDashboard(profile.role));
}
