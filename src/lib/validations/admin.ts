import { z } from "zod";

export const adminUserSuspensionSchema = z.object({
  userId: z.string().uuid(),
  isSuspended: z.boolean()
});

export const adminCourseActionSchema = z.object({
  courseId: z.string().uuid()
});

export const adminCommentActionSchema = z.object({
  commentId: z.string().uuid()
});
