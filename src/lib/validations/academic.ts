import { z } from "zod";
import { normaliseCourseCode } from "@/lib/academic";

export const semesterSchema = z.enum(["first", "second", "summer", "full-year"]);

export const materialTypeSchema = z.enum([
  "notes",
  "lecture_slides",
  "past_exam",
  "assignment",
  "tutorial",
  "project_resource",
  "study_guide",
  "other"
]);

export const onboardingSchema = z.object({
  schoolId: z.string().uuid("Select your school."),
  departmentId: z.string().uuid("Select your department or subject."),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers and underscores.")
    .optional()
    .or(z.literal("")),
  programme: z.string().trim().max(120).optional().or(z.literal("")),
  graduationYear: z.coerce.number().int().min(2020).max(2100).optional().or(z.literal(""))
});

export const schoolSuggestionSchema = z.object({
  name: z.string().trim().min(3).max(160),
  country: z.string().trim().min(2).max(80).default("Nigeria"),
  state: z.string().trim().max(80).optional().or(z.literal(""))
});

export const courseSuggestionSchema = z.object({
  schoolId: z.string().uuid(),
  departmentId: z.string().uuid("Select a department."),
  courseCode: z.string().trim().min(2).max(20).transform(normaliseCourseCode),
  courseTitle: z.string().trim().min(4).max(160),
  academicLevel: z.coerce.number().int().min(100).max(900).optional().or(z.literal("")),
  semester: semesterSchema.optional().or(z.literal(""))
});

export const academicSearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  school: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  type: materialTypeSchema.optional(),
  semester: semesterSchema.optional(),
  page: z.coerce.number().int().min(1).optional()
});

export const materialUploadSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  materialType: materialTypeSchema,
  academicSession: z.string().trim().max(20).optional().or(z.literal("")),
  semester: semesterSchema.optional().or(z.literal("")),
  originalSource: z.string().url().optional().or(z.literal("")),
  replacesMaterialId: z.string().uuid().optional().or(z.literal(""))
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type MaterialUploadInput = z.infer<typeof materialUploadSchema>;
