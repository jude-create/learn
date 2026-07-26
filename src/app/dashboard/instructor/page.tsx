import { BookOpen, FileText, Users } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function InstructorDashboardPage() {
  const { profile } = await requireProfile("instructor");
  const supabase = await createSupabaseServerClient();
  const [{ count: totalCourses }, { count: publishedCourses }, { count: lessons }] = await Promise.all([
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("instructor_id", profile.id),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("instructor_id", profile.id).eq("status", "published"),
    supabase.from("lessons").select("id", { count: "exact", head: true })
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Stat icon={<BookOpen className="h-5 w-5" />} label="Courses" value={totalCourses ?? 0} />
      <Stat icon={<Users className="h-5 w-5" />} label="Published" value={publishedCourses ?? 0} />
      <Stat icon={<FileText className="h-5 w-5" />} label="Lessons" value={lessons ?? 0} />
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
