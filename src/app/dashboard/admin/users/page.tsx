import { UserCheck, UserX } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setUserSuspensionAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminActionButton } from "@/components/admin/admin-action-button";

type AdminUsersPageProps = {
  searchParams: Promise<{
    q?: string;
    role?: string;
  }>;
};

type AdminProfile = {
  id: string;
  full_name: string;
  role: "student" | "instructor" | "admin";
  is_suspended: boolean;
  created_at: string;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { profile: currentAdmin } = await requireProfile("admin");
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("profiles").select("id,full_name,role,is_suspended,created_at").order("created_at", { ascending: false }).limit(50);

  if (params.q) {
    query = query.ilike("full_name", `%${params.q}%`);
  }

  if (params.role && ["student", "instructor", "admin"].includes(params.role)) {
    query = query.eq("role", params.role);
  }

  const { data } = await query;
  const profiles = (data as AdminProfile[] | null) ?? [];
  const emailByUserId = await getUserEmailMap();

  return (
    <div className="rounded-md border border-border bg-background">
      <div className="border-b border-border p-4">
        <h2 className="text-xl font-semibold">Users</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="q" defaultValue={params.q ?? ""} placeholder="Search users" />
          <select className="h-10 rounded-md border border-border px-3 text-sm" name="role" defaultValue={params.role ?? ""}>
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Admins</option>
          </select>
          <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Filter</button>
        </form>
      </div>
      {profiles.length === 0 ? (
        <div className="p-4">
          <EmptyState title="No users found" description="Try a different search or role filter." />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {profiles.map((profile) => (
          <div key={profile.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{emailByUserId.get(profile.id) ?? profile.id}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{profile.role}</Badge>
              {profile.is_suspended ? <Badge className="text-destructive">Suspended</Badge> : null}
              {profile.role !== "admin" && profile.id !== currentAdmin.id ? (
                <AdminActionButton
                  action={setUserSuspensionAction}
                  hiddenFields={{
                    userId: profile.id,
                    isSuspended: String(!profile.is_suspended)
                  }}
                  variant={profile.is_suspended ? "secondary" : "danger"}
                >
                  {profile.is_suspended ? <UserCheck className="h-4 w-4" aria-hidden /> : <UserX className="h-4 w-4" aria-hidden />}
                  {profile.is_suspended ? "Reactivate" : "Suspend"}
                </AdminActionButton>
              ) : null}
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function getUserEmailMap() {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    return new Map(data.users.map((user) => [user.id, user.email ?? user.id]));
  } catch {
    return new Map<string, string>();
  }
}
