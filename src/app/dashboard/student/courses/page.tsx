import Image from "next/image";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { CourseProgress } from "@/components/courses/course-progress";

type EnrolledCourse = {
  id: string;
  enrolled_at: string;
  courses: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    profiles: { full_name: string } | null;
    course_modules: {
      position: number;
      lessons: { id: string; slug: string; position: number }[] | null;
    }[] | null;
  } | null;
};

export default async function StudentCoursesPage() {
  const { profile } = await requireProfile("student");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("enrolments")
    .select("id,enrolled_at,courses(id,title,slug,thumbnail_url,profiles(full_name),course_modules(position,lessons(id,slug,position)))")
    .eq("student_id", profile.id)
    .order("enrolled_at", { ascending: false });
  const enrolments = data as unknown as EnrolledCourse[] | null;
  const { data: progressData } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("student_id", profile.id)
    .eq("is_completed", true);
  const completedLessonIds = new Set(((progressData as { lesson_id: string }[] | null) ?? []).map((item) => item.lesson_id));

  if (!enrolments?.length) {
    return <EmptyState title="No enrolled courses" description="Browse published courses and enrol to start learning." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {enrolments.map((item) => {
        const course = item.courses;
        const lessons = [...(course?.course_modules ?? [])]
          .sort((a, b) => a.position - b.position)
          .flatMap((module) => module.lessons ?? [])
          .sort((a, b) => a.position - b.position);
        const completed = lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length;
        const firstLesson = lessons[0];

        return (
          <div key={item.id} className="overflow-hidden rounded-md border border-border bg-background">
            <div className="aspect-[16/9] bg-muted">
              {course?.thumbnail_url ? (
                <Image src={course.thumbnail_url} alt="" width={640} height={360} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">Course</div>
              )}
            </div>
            <div className="p-5">
              <h2 className="font-semibold">{course?.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Instructor: {course?.profiles?.full_name ?? "Unknown"}</p>
              <div className="mt-5">
                <CourseProgress completed={completed} total={lessons.length} />
              </div>
              {course && firstLesson ? (
                <Link className="mt-5 block" href={`/learn/${course.slug}/${firstLesson.slug}`}>
                  <Button className="w-full">
                    <PlayCircle className="h-4 w-4" aria-hidden />
                    Continue learning
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
