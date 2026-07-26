import { BookOpen, MessageSquareText, Users } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  await requireProfile("admin");
  const supabase = await createSupabaseServerClient();
  const [{ count: users }, { count: courses }, { count: comments }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("comments").select("id", { count: "exact", head: true })
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Stat icon={<Users className="h-5 w-5" />} label="Users" value={users ?? 0} />
      <Stat icon={<BookOpen className="h-5 w-5" />} label="Courses" value={courses ?? 0} />
      <Stat icon={<MessageSquareText className="h-5 w-5" />} label="Comments" value={comments ?? 0} />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background p-5">
      <div className="text-primary">{icon}</div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
