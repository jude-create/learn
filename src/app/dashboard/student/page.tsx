import Link from "next/link";
import { BookOpen, CheckCircle2, PlayCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

type DashboardEnrolment = {
  id: string;
  enrolled_at: string;
  courses: {
    title: string;
    slug: string;
    course_modules: {
      position: number;
      lessons: { id: string; slug: string; position: number }[] | null;
    }[] | null;
  } | null;
};

export default async function StudentDashboardPage() {
  const { profile } = await requireProfile("student");
  const supabase = await createSupabaseServerClient();
  const [{ count: enrolledCount }, { count: completedCount }] = await Promise.all([
    supabase.from("enrolments").select("id", { count: "exact", head: true }).eq("student_id", profile.id),
    supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", profile.id)
      .eq("is_completed", true)
  ]);
  const { data: recentData } = await supabase
    .from("enrolments")
    .select("id,enrolled_at,courses(title,slug,course_modules(position,lessons(id,slug,position)))")
    .eq("student_id", profile.id)
    .order("enrolled_at", { ascending: false })
    .limit(3);
  const recent = (recentData as unknown as DashboardEnrolment[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-border bg-background p-5">
          <BookOpen className="h-5 w-5 text-primary" aria-hidden />
          <p className="mt-4 text-3xl font-bold">{enrolledCount ?? 0}</p>
          <p className="text-sm text-muted-foreground">Enrolled courses</p>
        </div>
        <div className="rounded-md border border-border bg-background p-5">
          <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
          <p className="mt-4 text-3xl font-bold">{completedCount ?? 0}</p>
          <p className="text-sm text-muted-foreground">Completed lessons</p>
        </div>
      </div>

      <section className="rounded-md border border-border bg-background p-5">
        <h2 className="text-lg font-semibold">Continue learning</h2>
        <div className="mt-4 grid gap-3">
          {recent.map((item) => {
            const course = item.courses;
            const firstLesson = (course?.course_modules ?? [])
              .sort((a, b) => a.position - b.position)
              .flatMap((module) => [...(module.lessons ?? [])].sort((a, b) => a.position - b.position))[0];

            return course && firstLesson ? (
              <Link key={item.id} href={`/learn/${course.slug}/${firstLesson.slug}`} className="flex items-center justify-between rounded-md border border-border p-4 transition hover:bg-muted">
                <span className="font-medium">{course.title}</span>
                <Button variant="ghost">
                  <PlayCircle className="h-4 w-4" aria-hidden />
                  Open
                </Button>
              </Link>
            ) : null;
          })}
          {recent.length === 0 ? <p className="text-sm text-muted-foreground">Your enrolled courses will appear here.</p> : null}
        </div>
      </section>
    </div>
  );
}
