"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminCommentActionSchema, adminCourseActionSchema, adminUserSuspensionSchema } from "@/lib/validations/admin";

export async function setUserSuspensionAction(formData: FormData) {
  const { profile } = await requireProfile("admin");
  const parsed = adminUserSuspensionSchema.safeParse({
    userId: formData.get("userId"),
    isSuspended: formData.get("isSuspended") === "true"
  });

  if (!parsed.success || parsed.data.userId === profile.id) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("profiles")
    .update({ is_suspended: parsed.data.isSuspended })
    .eq("id", parsed.data.userId)
    .neq("role", "admin");

  revalidatePath("/dashboard/admin/users");
}

export async function adminUnpublishCourseAction(formData: FormData) {
  await requireProfile("admin");
  const parsed = adminCourseActionSchema.safeParse({
    courseId: formData.get("courseId")
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("courses").update({ status: "unpublished" }).eq("id", parsed.data.courseId);

  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/courses");
}

export async function adminDeleteCommentAction(formData: FormData) {
  await requireProfile("admin");
  const parsed = adminCommentActionSchema.safeParse({
    commentId: formData.get("commentId")
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("comments").delete().eq("id", parsed.data.commentId);

  revalidatePath("/dashboard/admin/comments");
  revalidatePath("/learn", "layout");
}
