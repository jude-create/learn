import Link from "next/link";
import { Plus } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseStatusActions } from "@/components/courses/course-status-actions";

export default async function InstructorCoursesPage() {
  const { profile } = await requireProfile("instructor");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("courses")
    .select("id,title,status,category,level,created_at,course_modules(id,lessons(id)),enrolments(id)")
    .eq("instructor_id", profile.id)
    .order("created_at", { ascending: false });
  const courses = data as unknown as {
    id: string;
    title: string;
    status: "draft" | "published" | "unpublished";
    category: string;
    level: string;
    created_at: string;
    course_modules: { id: string; lessons: { id: string }[] | null }[] | null;
    enrolments: { id: string }[] | null;
  }[] | null;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Courses</h2>
        <Link href="/dashboard/instructor/courses/new">
          <Button>
            <Plus className="h-4 w-4" aria-hidden />
            Create course
          </Button>
        </Link>
      </div>
      {!courses?.length ? (
        <div className="mt-6">
          <EmptyState title="No courses yet" description="Create a draft course, then add modules and lessons." />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {courses.map((course) => (
            <div key={course.id} className="rounded-md border border-border bg-background p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {course.category} / {course.level}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {course.course_modules?.length ?? 0} modules /{" "}
                    {(course.course_modules ?? []).reduce((total, module) => total + (module.lessons?.length ?? 0), 0)} lessons /{" "}
                    {course.enrolments?.length ?? 0} students
                  </p>
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <Badge>{course.status}</Badge>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/instructor/courses/${course.id}/edit`}>
                      <Button variant="secondary">Edit</Button>
                    </Link>
                    <CourseStatusActions courseId={course.id} status={course.status} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
