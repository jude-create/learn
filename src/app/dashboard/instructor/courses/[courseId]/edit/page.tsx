import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateCourseAction } from "@/lib/actions/courses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseForm } from "@/components/courses/course-form";
import { CourseStatusActions } from "@/components/courses/course-status-actions";
import { ModuleManager, type CourseModuleWithLessons } from "@/components/courses/module-manager";
import type { CourseLevel, CourseStatus } from "@/types/database";

type EditCoursePageProps = {
  params: Promise<{ courseId: string }>;
};

type EditableCourse = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  category: string;
  level: CourseLevel;
  status: CourseStatus;
  instructor_id: string;
  course_modules: CourseModuleWithLessons[] | null;
};

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { courseId } = await params;
  const { profile } = await requireProfile("instructor");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("courses")
    .select("id,title,slug,description,thumbnail_url,category,level,status,instructor_id,course_modules(id,title,position,lessons(id,title,slug,content,video_url,document_url,position))")
    .eq("id", courseId)
    .single();
  const course = data as unknown as EditableCourse | null;

  if (!course || course.instructor_id !== profile.id) {
    notFound();
  }

  const modules = [...(course.course_modules ?? [])]
    .map((module) => ({
      ...module,
      lessons: [...(module.lessons ?? [])].sort((a, b) => a.position - b.position)
    }))
    .sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-md border border-border bg-background p-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold">{course.title}</h2>
            <Badge>{course.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Edit course content, manage lesson order, then publish when ready.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {course.status === "published" ? (
            <Link href={`/courses/${course.slug}`}>
              <Button variant="secondary">
                <ExternalLink className="h-4 w-4" aria-hidden />
                Public page
              </Button>
            </Link>
          ) : null}
          <CourseStatusActions courseId={course.id} status={course.status} />
        </div>
      </div>

      <section className="rounded-md border border-border bg-background p-5">
        <h3 className="text-lg font-semibold">Course information</h3>
        <div className="mt-5">
          <CourseForm
            courseId={course.id}
            action={updateCourseAction}
            submitLabel="Save course"
            defaultValues={{
              title: course.title,
              description: course.description,
              category: course.category,
              level: course.level,
              thumbnailUrl: course.thumbnail_url ?? ""
            }}
          />
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Modules and lessons</h3>
          <p className="mt-1 text-sm text-muted-foreground">Use simple move controls for ordering in the MVP.</p>
        </div>
        <ModuleManager courseId={course.id} modules={modules} />
      </section>
    </div>
  );
}
