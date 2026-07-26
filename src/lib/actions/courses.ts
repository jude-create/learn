"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import {
  courseFormSchema,
  courseIdSchema,
  lessonFormSchema,
  lessonIdSchema,
  moduleFormSchema,
  moduleIdSchema
} from "@/lib/validations/courses";
import type { CourseStatus } from "@/types/database";

export type CourseActionState = {
  ok: boolean;
  message: string;
};

async function ensureCourseOwner(courseId: string) {
  const { profile } = await requireProfile("instructor");
  const supabase = await createSupabaseServerClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id,instructor_id,status,slug")
    .eq("id", courseId)
    .single();

  if (!course || course.instructor_id !== profile.id) {
    return null;
  }

  return { supabase, profile, course };
}

async function ensureModuleOwner(moduleId: string) {
  const { profile } = await requireProfile("instructor");
  const supabase = await createSupabaseServerClient();
  const { data: moduleData } = await supabase
    .from("course_modules")
    .select("id,course_id,position,courses(id,instructor_id)")
    .eq("id", moduleId)
    .single();
  const moduleRecord = moduleData as unknown as {
    id: string;
    course_id: string;
    position: number;
    courses: { id: string; instructor_id: string } | null;
  } | null;
  const course = moduleRecord?.courses ?? null;

  if (!moduleRecord || !course || course.instructor_id !== profile.id) {
    return null;
  }

  return { supabase, module: { id: moduleRecord.id, course_id: moduleRecord.course_id, position: moduleRecord.position } };
}

async function ensureLessonOwner(lessonId: string) {
  const { profile } = await requireProfile("instructor");
  const supabase = await createSupabaseServerClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id,module_id,position,course_modules(id,course_id,courses(id,instructor_id))")
    .eq("id", lessonId)
    .single();
  const lessonRecord = lesson as unknown as {
    id: string;
    module_id: string;
    position: number;
    course_modules: {
      id: string;
      course_id: string;
      courses: { id: string; instructor_id: string } | null;
    } | null;
  } | null;
  const lessonModule = lessonRecord?.course_modules as {
    id: string;
    course_id: string;
    courses: { id: string; instructor_id: string } | null;
  } | null;

  if (!lessonRecord || !lessonModule?.courses || lessonModule.courses.instructor_id !== profile.id) {
    return null;
  }

  return { supabase, lesson: { id: lessonRecord.id, module_id: lessonRecord.module_id, position: lessonRecord.position, course_id: lessonModule.course_id } };
}

async function uniqueCourseSlug(title: string) {
  const supabase = await createSupabaseServerClient();
  const base = slugify(title) || "course";
  let slug = base;
  let suffix = 2;

  while (true) {
    const { data } = await supabase.from("courses").select("id").eq("slug", slug).maybeSingle();
    if (!data) {
      return slug;
    }
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function createCourseAction(_: CourseActionState, formData: FormData): Promise<CourseActionState> {
  const { profile } = await requireProfile("instructor");
  const parsed = courseFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    level: formData.get("level"),
    thumbnailUrl: formData.get("thumbnailUrl")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Check the course details." };
  }

  const supabase = await createSupabaseServerClient();
  const slug = await uniqueCourseSlug(parsed.data.title);
  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      category: parsed.data.category,
      level: parsed.data.level,
      thumbnail_url: parsed.data.thumbnailUrl || null,
      instructor_id: profile.id,
      status: "draft"
    })
    .select("id")
    .single();

  if (error || !course) {
    return { ok: false, message: error?.message ?? "Could not create course." };
  }

  revalidatePath("/dashboard/instructor/courses");
  redirect(`/dashboard/instructor/courses/${course.id}/edit`);
}

export async function updateCourseAction(_: CourseActionState, formData: FormData): Promise<CourseActionState> {
  const idParsed = courseIdSchema.safeParse({ courseId: formData.get("courseId") });
  const parsed = courseFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    level: formData.get("level"),
    thumbnailUrl: formData.get("thumbnailUrl")
  });

  if (!idParsed.success || !parsed.success) {
    return { ok: false, message: parsed.error?.errors[0]?.message ?? "Check the course details." };
  }

  const owner = await ensureCourseOwner(idParsed.data.courseId);
  if (!owner) {
    return { ok: false, message: "You cannot edit this course." };
  }

  const { error } = await owner.supabase
    .from("courses")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      level: parsed.data.level,
      thumbnail_url: parsed.data.thumbnailUrl || null
    })
    .eq("id", idParsed.data.courseId);

  revalidatePath(`/dashboard/instructor/courses/${idParsed.data.courseId}/edit`);
  revalidatePath("/courses");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Course updated." };
}

export async function setCourseStatusAction(formData: FormData) {
  const parsed = courseIdSchema.safeParse({ courseId: formData.get("courseId") });
  const status = formData.get("status");

  if (!parsed.success || !["draft", "published", "unpublished"].includes(String(status))) {
    return;
  }

  const owner = await ensureCourseOwner(parsed.data.courseId);
  if (!owner) {
    return;
  }

  const nextStatus = status as CourseStatus;
  const { count: lessonCount } = await owner.supabase
    .from("lessons")
    .select("id,course_modules!inner(course_id)", { count: "exact", head: true })
    .eq("course_modules.course_id", parsed.data.courseId);

  if (nextStatus === "published" && !lessonCount) {
    return;
  }

  await owner.supabase.from("courses").update({ status: nextStatus }).eq("id", parsed.data.courseId);
  revalidatePath("/dashboard/instructor/courses");
  revalidatePath(`/dashboard/instructor/courses/${parsed.data.courseId}/edit`);
  revalidatePath("/courses");
}

export async function deleteDraftCourseAction(formData: FormData) {
  const parsed = courseIdSchema.safeParse({ courseId: formData.get("courseId") });
  if (!parsed.success) {
    return;
  }

  const owner = await ensureCourseOwner(parsed.data.courseId);
  if (!owner || owner.course.status !== "draft") {
    return;
  }

  const { error } = await owner.supabase.from("courses").delete().eq("id", parsed.data.courseId);
  if (error) {
    return;
  }

  revalidatePath("/dashboard/instructor/courses");
  redirect("/dashboard/instructor/courses");
}

export async function createModuleAction(formData: FormData) {
  const idParsed = courseIdSchema.safeParse({ courseId: formData.get("courseId") });
  const parsed = moduleFormSchema.safeParse({ title: formData.get("title") });
  if (!idParsed.success || !parsed.success) {
    return;
  }

  const owner = await ensureCourseOwner(idParsed.data.courseId);
  if (!owner) {
    return;
  }

  const { data: lastModule } = await owner.supabase
    .from("course_modules")
    .select("position")
    .eq("course_id", idParsed.data.courseId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  await owner.supabase.from("course_modules").insert({
    course_id: idParsed.data.courseId,
    title: parsed.data.title,
    position: (lastModule?.position ?? 0) + 1
  });

  revalidatePath(`/dashboard/instructor/courses/${idParsed.data.courseId}/edit`);
}

export async function updateModuleAction(formData: FormData) {
  const idParsed = moduleIdSchema.safeParse({ moduleId: formData.get("moduleId") });
  const parsed = moduleFormSchema.safeParse({ title: formData.get("title") });
  if (!idParsed.success || !parsed.success) {
    return;
  }

  const owner = await ensureModuleOwner(idParsed.data.moduleId);
  if (!owner) {
    return;
  }

  await owner.supabase.from("course_modules").update({ title: parsed.data.title }).eq("id", owner.module.id);
  revalidatePath(`/dashboard/instructor/courses/${owner.module.course_id}/edit`);
}

export async function deleteModuleAction(formData: FormData) {
  const parsed = moduleIdSchema.safeParse({ moduleId: formData.get("moduleId") });
  if (!parsed.success) {
    return;
  }

  const owner = await ensureModuleOwner(parsed.data.moduleId);
  if (!owner) {
    return;
  }

  await owner.supabase.from("course_modules").delete().eq("id", owner.module.id);
  revalidatePath(`/dashboard/instructor/courses/${owner.module.course_id}/edit`);
}

export async function moveModuleAction(formData: FormData) {
  const parsed = moduleIdSchema.safeParse({ moduleId: formData.get("moduleId") });
  const direction = formData.get("direction") === "up" ? "up" : "down";
  if (!parsed.success) {
    return;
  }

  const owner = await ensureModuleOwner(parsed.data.moduleId);
  if (!owner) {
    return;
  }

  const operator = direction === "up" ? "lt" : "gt";
  const ascending = direction !== "up";
  const query = owner.supabase
    .from("course_modules")
    .select("id,position")
    .eq("course_id", owner.module.course_id)
    .order("position", { ascending })
    .limit(1);
  const { data: neighbor } = operator === "lt"
    ? await query.lt("position", owner.module.position).maybeSingle()
    : await query.gt("position", owner.module.position).maybeSingle();

  if (!neighbor) {
    return;
  }

  await owner.supabase.from("course_modules").update({ position: -1 }).eq("id", owner.module.id);
  await owner.supabase.from("course_modules").update({ position: owner.module.position }).eq("id", neighbor.id);
  await owner.supabase.from("course_modules").update({ position: neighbor.position }).eq("id", owner.module.id);
  revalidatePath(`/dashboard/instructor/courses/${owner.module.course_id}/edit`);
}

export async function createLessonAction(formData: FormData) {
  const idParsed = moduleIdSchema.safeParse({ moduleId: formData.get("moduleId") });
  const parsed = lessonFormSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    videoUrl: formData.get("videoUrl"),
    documentUrl: formData.get("documentUrl")
  });
  if (!idParsed.success || !parsed.success) {
    return;
  }

  const owner = await ensureModuleOwner(idParsed.data.moduleId);
  if (!owner) {
    return;
  }

  const { data: lastLesson } = await owner.supabase
    .from("lessons")
    .select("position")
    .eq("module_id", owner.module.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  await owner.supabase.from("lessons").insert({
    module_id: owner.module.id,
    title: parsed.data.title,
    slug: slugify(parsed.data.title) || "lesson",
    content: parsed.data.content,
    video_url: parsed.data.videoUrl || null,
    document_url: parsed.data.documentUrl || null,
    position: (lastLesson?.position ?? 0) + 1
  });

  revalidatePath(`/dashboard/instructor/courses/${owner.module.course_id}/edit`);
}

export async function updateLessonAction(formData: FormData) {
  const idParsed = lessonIdSchema.safeParse({ lessonId: formData.get("lessonId") });
  const parsed = lessonFormSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    videoUrl: formData.get("videoUrl"),
    documentUrl: formData.get("documentUrl")
  });
  if (!idParsed.success || !parsed.success) {
    return;
  }

  const owner = await ensureLessonOwner(idParsed.data.lessonId);
  if (!owner) {
    return;
  }

  await owner.supabase
    .from("lessons")
    .update({
      title: parsed.data.title,
      slug: slugify(parsed.data.title) || "lesson",
      content: parsed.data.content,
      video_url: parsed.data.videoUrl || null,
      document_url: parsed.data.documentUrl || null
    })
    .eq("id", owner.lesson.id);

  revalidatePath(`/dashboard/instructor/courses/${owner.lesson.course_id}/edit`);
}

export async function deleteLessonAction(formData: FormData) {
  const parsed = lessonIdSchema.safeParse({ lessonId: formData.get("lessonId") });
  if (!parsed.success) {
    return;
  }

  const owner = await ensureLessonOwner(parsed.data.lessonId);
  if (!owner) {
    return;
  }

  await owner.supabase.from("lessons").delete().eq("id", owner.lesson.id);
  revalidatePath(`/dashboard/instructor/courses/${owner.lesson.course_id}/edit`);
}

export async function moveLessonAction(formData: FormData) {
  const parsed = lessonIdSchema.safeParse({ lessonId: formData.get("lessonId") });
  const direction = formData.get("direction") === "up" ? "up" : "down";
  if (!parsed.success) {
    return;
  }

  const owner = await ensureLessonOwner(parsed.data.lessonId);
  if (!owner) {
    return;
  }

  const operator = direction === "up" ? "lt" : "gt";
  const ascending = direction !== "up";
  const query = owner.supabase
    .from("lessons")
    .select("id,position")
    .eq("module_id", owner.lesson.module_id)
    .order("position", { ascending })
    .limit(1);
  const { data: neighbor } = operator === "lt"
    ? await query.lt("position", owner.lesson.position).maybeSingle()
    : await query.gt("position", owner.lesson.position).maybeSingle();

  if (!neighbor) {
    return;
  }

  await owner.supabase.from("lessons").update({ position: -1 }).eq("id", owner.lesson.id);
  await owner.supabase.from("lessons").update({ position: owner.lesson.position }).eq("id", neighbor.id);
  await owner.supabase.from("lessons").update({ position: neighbor.position }).eq("id", owner.lesson.id);
  revalidatePath(`/dashboard/instructor/courses/${owner.lesson.course_id}/edit`);
}
