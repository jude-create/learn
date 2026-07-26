import { z } from "zod";

export const commentSchema = z.object({
  lessonId: z.string().uuid(),
  parentCommentId: z.string().uuid().nullable().optional(),
  content: z.string().trim().min(2, "Comment cannot be empty.").max(4000)
});

export const commentUpdateSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().trim().min(2).max(4000)
});

export const commentModerationSchema = z.object({
  commentId: z.string().uuid(),
  enabled: z.boolean()
});
