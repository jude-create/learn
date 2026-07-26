"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FirstLesson = {
  lesson_slug: string;
  course_slug: string;
  module_position: number;
  lesson_position: number;
};

export async function enrolInCourseAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const courseSlug = String(formData.get("courseSlug") ?? "");
  const { profile } = await requireProfile("student");
  const supabase = await createSupabaseServerClient();

  if (!courseId || !courseSlug) {
    return;
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id,status")
    .eq("id", courseId)
    .eq("status", "published")
    .single();

  if (!course) {
    return;
  }

  await supabase.from("enrolments").upsert(
    {
      student_id: profile.id,
      course_id: courseId
    },
    { onConflict: "student_id,course_id" }
  );

  const { data: outlineData } = await supabase
    .from("public_lesson_outline")
    .select("lesson_slug,course_slug,module_position,lesson_position")
    .eq("course_id", courseId)
    .order("module_position", { ascending: true })
    .order("lesson_position", { ascending: true })
    .limit(1)
    .maybeSingle();
  const firstLesson = outlineData as FirstLesson | null;

  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/courses");

  if (firstLesson) {
    redirect(`/learn/${firstLesson.course_slug}/${firstLesson.lesson_slug}`);
  }

  redirect(`/courses/${courseSlug}`);
}

export async function markLessonProgressAction(formData: FormData) {
  const lessonId = String(formData.get("lessonId") ?? "");
  const courseSlug = String(formData.get("courseSlug") ?? "");
  const lessonSlug = String(formData.get("lessonSlug") ?? "");
  const isCompleted = formData.get("isCompleted") === "true";
  const { profile } = await requireProfile("student");

  if (!lessonId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("lesson_progress").upsert(
    {
      student_id: profile.id,
      lesson_id: lessonId,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null
    },
    { onConflict: "student_id,lesson_id" }
  );

  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/courses");
  if (courseSlug && lessonSlug) {
    revalidatePath(`/learn/${courseSlug}/${lessonSlug}`);
  }
}
