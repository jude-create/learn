"use server";

import { revalidatePath } from "next/cache";
import { normaliseCourseCode, formatCourseCode, toPrismaSemester } from "@/lib/academic";
import { prisma } from "@/lib/prisma";
import { courseSuggestionSchema } from "@/lib/validations/academic";
import { requireActiveUser } from "@/server/auth/guards";

type ActionState = {
  ok: boolean;
  message: string;
};

export async function suggestCourseAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireActiveUser();
  const parsed = courseSuggestionSchema.safeParse({
    schoolId: formData.get("schoolId"),
    departmentId: formData.get("departmentId"),
    courseCode: formData.get("courseCode"),
    courseTitle: formData.get("courseTitle"),
    academicLevel: formData.get("academicLevel"),
    semester: formData.get("semester")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Check the course details." };
  }

  const department = await prisma.department.findFirst({
    where: {
      id: parsed.data.departmentId,
      schoolId: parsed.data.schoolId
    },
    select: { id: true }
  });

  if (!department) {
    return { ok: false, message: "Choose a department that belongs to the selected school." };
  }

  const normalisedCourseCode = normaliseCourseCode(parsed.data.courseCode);
  const existing = await prisma.academicCourse.findFirst({
    where: {
      schoolId: parsed.data.schoolId,
      departmentId: parsed.data.departmentId,
      normalisedCourseCode
    },
    select: { id: true, slug: true }
  });

  if (existing) {
    return { ok: false, message: `${formatCourseCode(normalisedCourseCode)} already exists for this department.` };
  }

  await prisma.courseSuggestion.create({
    data: {
      schoolId: parsed.data.schoolId,
      departmentId: parsed.data.departmentId,
      courseCode: formatCourseCode(normalisedCourseCode),
      normalisedCourseCode,
      courseTitle: parsed.data.courseTitle,
      academicLevel: typeof parsed.data.academicLevel === "number" ? parsed.data.academicLevel : null,
      semester: toPrismaSemester(parsed.data.semester),
      suggestedBy: profile.id
    }
  });

  revalidatePath("/schools");
  return { ok: true, message: "Course suggestion submitted for admin review." };
}
