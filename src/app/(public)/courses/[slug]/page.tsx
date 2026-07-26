import Link from "next/link";
import Image from "next/image";
import { BookOpen, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnrolButton } from "@/components/courses/enrol-button";

type CourseDetails = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  category: string;
  level: string;
  instructor_id: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
  course_modules: {
    id: string;
    title: string;
    position: number;
  }[] | null;
  enrolments: { id: string }[] | null;
};

type LessonOutline = {
  lesson_id: string;
  lesson_title: string;
  lesson_slug: string;
  lesson_position: number;
  module_position: number;
  module_id: string;
};

export default async function CourseDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const session = await getCurrentProfile();
  const { data } = await supabase
    .from("courses")
    .select("*,profiles(full_name,avatar_url),course_modules(id,title,position),enrolments(id)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  const course = data as unknown as CourseDetails | null;

  if (!course) {
    notFound();
  }

  const { data: outlineData } = await supabase
    .from("public_lesson_outline")
    .select("lesson_id,lesson_title,lesson_slug,lesson_position,module_position,module_id")
    .eq("course_id", course.id);
  const outline = (outlineData as unknown as LessonOutline[] | null) ?? [];
  const modules = [...(course.course_modules ?? [])].sort((a, b) => a.position - b.position);
  const lessonCount = outline.length;
  const firstLesson = [...outline].sort((a, b) => a.module_position - b.module_position || a.lesson_position - b.lesson_position)[0];
  const { data: enrolment } = session?.profile.role === "student"
    ? await supabase
        .from("enrolments")
        .select("id")
        .eq("course_id", course.id)
        .eq("student_id", session.profile.id)
        .maybeSingle()
    : { data: null };
  const ownsCourse = session?.profile.role === "instructor" && session.profile.id === course.instructor_id;
  const canContinue = Boolean(enrolment) || session?.profile.role === "admin" || ownsCourse;

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_320px]">
      <section>
        <Badge>{course.level}</Badge>
        {course.thumbnail_url ? (
          <Image src={course.thumbnail_url} alt="" width={960} height={540} className="mb-6 mt-4 aspect-[16/9] w-full rounded-md object-cover" />
        ) : null}
        <h1 className="mt-4 text-3xl font-bold">{course.title}</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">{course.description}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <BookOpen className="h-4 w-4" aria-hidden />
            {modules.length} modules / {lessonCount} lessons
          </span>
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4" aria-hidden />
            {course.enrolments?.length ?? 0} enrolled
          </span>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold">Course outline</h2>
          <div className="mt-4 space-y-4">
            {modules.map((module) => (
              <div key={module.id} className="rounded-md border border-border p-4">
                <h3 className="font-semibold">{module.title}</h3>
                <ol className="mt-3 space-y-2">
                  {outline
                    .filter((lesson) => lesson.module_id === module.id)
                    .sort((a, b) => a.lesson_position - b.lesson_position)
                    .map((lesson) => (
                      <li key={lesson.lesson_id} className="text-sm text-muted-foreground">
                        {lesson.lesson_title}
                      </li>
                    ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="h-fit rounded-md border border-border p-5">
        <p className="text-sm text-muted-foreground">Instructor</p>
        <p className="mt-1 font-semibold">{course.profiles?.full_name ?? "Instructor"}</p>
        <p className="mt-4 text-sm text-muted-foreground">Category</p>
        <p className="font-medium">{course.category}</p>
        <div className="mt-6">
          {!session ? (
            <Link className="block" href="/login">
              <Button className="w-full">Login to enrol</Button>
            </Link>
          ) : session.profile.role === "student" ? (
            <EnrolButton
              courseId={course.id}
              courseSlug={course.slug}
              isEnrolled={Boolean(enrolment)}
              firstLessonSlug={firstLesson?.lesson_slug}
            />
          ) : canContinue && firstLesson ? (
            <Link href={`/learn/${course.slug}/${firstLesson.lesson_slug}`}>
              <Button className="w-full">Preview lessons</Button>
            </Link>
          ) : (
            <Button className="w-full" disabled>
              Student enrolment only
            </Button>
          )}
        </div>
      </aside>
    </main>
  );
}
