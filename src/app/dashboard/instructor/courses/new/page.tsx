import { requireProfile } from "@/lib/auth/session";
import { createCourseAction } from "@/lib/actions/courses";
import { CourseForm } from "@/components/courses/course-form";

export default async function NewCoursePage() {
  await requireProfile("instructor");

  return (
    <div className="mx-auto max-w-3xl rounded-md border border-border bg-background p-6">
      <h2 className="text-2xl font-bold">Create course</h2>
      <p className="mt-2 text-muted-foreground">Create a draft first. You can add modules and lessons before publishing.</p>
      <div className="mt-6">
        <CourseForm action={createCourseAction} submitLabel="Create draft" />
      </div>
    </div>
  );
}
