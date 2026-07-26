import { z } from "zod";

export const courseLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);

export const courseFormSchema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(20).max(3000),
  category: z.string().trim().min(2).max(80),
  level: courseLevelSchema,
  thumbnailUrl: z.string().url().optional().or(z.literal(""))
});

export const moduleFormSchema = z.object({
  title: z.string().trim().min(3).max(120)
});

export const lessonFormSchema = z.object({
  title: z.string().trim().min(3).max(140),
  content: z.string().trim().min(20),
  videoUrl: z.string().url().optional().or(z.literal("")),
  documentUrl: z.string().url().optional().or(z.literal(""))
});

export const courseIdSchema = z.object({
  courseId: z.string().uuid()
});

export const moduleIdSchema = z.object({
  moduleId: z.string().uuid()
});

export const lessonIdSchema = z.object({
  lessonId: z.string().uuid()
});

export type CourseFormInput = z.infer<typeof courseFormSchema>;
export type ModuleFormInput = z.infer<typeof moduleFormSchema>;
export type LessonFormInput = z.infer<typeof lessonFormSchema>;

export const courseSearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  level: courseLevelSchema.optional(),
  page: z.coerce.number().int().min(1).optional()
});
