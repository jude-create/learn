"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { commentModerationSchema, commentSchema, commentUpdateSchema } from "@/lib/validations/comments";
import type { LessonComment } from "@/types/comments";

export type CommentActionState = {
  ok: boolean;
  message: string;
  comment?: LessonComment;
  commentId?: string;
};

type CommentRecord = {
  id: string;
  lesson_id: string;
  user_id: string;
  parent_comment_id: string | null;
  lessons: {
    slug: string;
    course_modules: {
      courses: {
        slug: string;
        instructor_id: string;
      } | null;
    } | null;
  } | null;
};

type LessonContext = {
  id: string;
  slug: string;
  course_modules: {
    courses: {
      slug: string;
    } | null;
  } | null;
};

async function revalidateLessonId(lessonId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("lessons")
    .select("id,slug,course_modules(courses(slug))")
    .eq("id", lessonId)
    .single();
  const lesson = data as unknown as LessonContext | null;
  const courseSlug = lesson?.course_modules?.courses?.slug;

  if (courseSlug && lesson?.slug) {
    revalidatePath(`/learn/${courseSlug}/${lesson.slug}`);
  }
}

async function getCommentContext(commentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("comments")
    .select("id,lesson_id,user_id,parent_comment_id,lessons(slug,course_modules(courses(slug,instructor_id)))")
    .eq("id", commentId)
    .single();

  return {
    supabase,
    comment: data as unknown as CommentRecord | null
  };
}

function revalidateLesson(comment: CommentRecord) {
  const courseSlug = comment.lessons?.course_modules?.courses?.slug;
  const lessonSlug = comment.lessons?.slug;

  if (courseSlug && lessonSlug) {
    revalidatePath(`/learn/${courseSlug}/${lessonSlug}`);
  }
}

export async function createCommentAction(_: CommentActionState, formData: FormData): Promise<CommentActionState> {
  const { profile } = await requireProfile();
  const parsed = commentSchema.safeParse({
    lessonId: formData.get("lessonId"),
    parentCommentId: formData.get("parentCommentId") || null,
    content: formData.get("content")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Check your comment." };
  }

  const supabase = await createSupabaseServerClient();

  if (parsed.data.parentCommentId) {
    const { data: parent } = await supabase
      .from("comments")
      .select("id,lesson_id,parent_comment_id")
      .eq("id", parsed.data.parentCommentId)
      .single();
    const parentComment = parent as { id: string; lesson_id: string; parent_comment_id: string | null } | null;

    if (!parentComment || parentComment.lesson_id !== parsed.data.lessonId || parentComment.parent_comment_id) {
      return { ok: false, message: "Replies can only be added to main comments." };
    }
  }

  const { data: created, error } = await supabase
    .from("comments")
    .insert({
      lesson_id: parsed.data.lessonId,
      user_id: profile.id,
      parent_comment_id: parsed.data.parentCommentId ?? null,
      content: parsed.data.content
    })
    .select("id,lesson_id,user_id,parent_comment_id,content,is_pinned,is_accepted_answer,created_at,updated_at,profiles(id,full_name,role,avatar_url),comment_votes(user_id)")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  await revalidateLessonId(parsed.data.lessonId);
  return {
    ok: true,
    message: "Comment posted.",
    comment: { ...(created as unknown as Omit<LessonComment, "replies">), replies: [] }
  };
}

export async function updateCommentAction(_: CommentActionState, formData: FormData): Promise<CommentActionState> {
  const { profile } = await requireProfile();
  const parsed = commentUpdateSchema.safeParse({
    commentId: formData.get("commentId"),
    content: formData.get("content")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Check your comment." };
  }

  const { supabase, comment } = await getCommentContext(parsed.data.commentId);
  if (!comment || (comment.user_id !== profile.id && profile.role !== "admin")) {
    return { ok: false, message: "You cannot edit this comment." };
  }

  const { data: updated, error } = await supabase
    .from("comments")
    .update({ content: parsed.data.content })
    .eq("id", parsed.data.commentId)
    .select("id,lesson_id,user_id,parent_comment_id,content,is_pinned,is_accepted_answer,created_at,updated_at,profiles(id,full_name,role,avatar_url),comment_votes(user_id)")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateLesson(comment);
  return {
    ok: true,
    message: "Comment updated.",
    comment: { ...(updated as unknown as Omit<LessonComment, "replies">), replies: comment.parent_comment_id ? [] : [] }
  };
}

export async function deleteCommentAction(formData: FormData): Promise<CommentActionState> {
  const { profile } = await requireProfile();
  const commentId = String(formData.get("commentId") ?? "");
  if (!commentId) {
    return { ok: false, message: "Missing comment." };
  }

  const { supabase, comment } = await getCommentContext(commentId);
  if (!comment || (comment.user_id !== profile.id && profile.role !== "admin")) {
    return { ok: false, message: "You cannot delete this comment." };
  }

  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateLesson(comment);
  return { ok: true, message: "Comment deleted.", commentId };
}

export async function toggleCommentVoteAction(formData: FormData) {
  const { profile } = await requireProfile();
  const commentId = String(formData.get("commentId") ?? "");
  if (!commentId) {
    return;
  }

  const { supabase, comment } = await getCommentContext(commentId);
  if (!comment) {
    return;
  }

  const { data: existingVote } = await supabase
    .from("comment_votes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existingVote) {
    await supabase.from("comment_votes").delete().eq("comment_id", commentId).eq("user_id", profile.id);
  } else {
    await supabase.from("comment_votes").insert({ comment_id: commentId, user_id: profile.id });
  }

  revalidateLesson(comment);
}

export async function setCommentPinnedAction(formData: FormData) {
  const { profile } = await requireProfile("instructor");
  const parsed = commentModerationSchema.safeParse({
    commentId: formData.get("commentId"),
    enabled: formData.get("enabled") === "true"
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, comment } = await getCommentContext(parsed.data.commentId);
  const instructorId = comment?.lessons?.course_modules?.courses?.instructor_id;
  if (!comment || instructorId !== profile.id) {
    return;
  }

  await supabase.from("comments").update({ is_pinned: parsed.data.enabled }).eq("id", comment.id);
  revalidateLesson(comment);
}

export async function setAcceptedAnswerAction(formData: FormData) {
  const { profile } = await requireProfile("instructor");
  const parsed = commentModerationSchema.safeParse({
    commentId: formData.get("commentId"),
    enabled: formData.get("enabled") === "true"
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, comment } = await getCommentContext(parsed.data.commentId);
  const instructorId = comment?.lessons?.course_modules?.courses?.instructor_id;
  if (!comment || instructorId !== profile.id) {
    return;
  }

  if (parsed.data.enabled) {
    await supabase
      .from("comments")
      .update({ is_accepted_answer: false })
      .eq("lesson_id", comment.lesson_id)
      .neq("id", comment.id);
  }

  await supabase
    .from("comments")
    .update({ is_accepted_answer: parsed.data.enabled })
    .eq("id", comment.id);
  revalidateLesson(comment);
}
