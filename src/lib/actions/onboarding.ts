"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { onboardingSchema, schoolSuggestionSchema } from "@/lib/validations/academic";

type ActionState = {
  ok: boolean;
  message: string;
};

export async function completeOnboardingAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getCurrentProfile();
  if (!session) {
    redirect("/login");
  }

  if (session.profile.is_suspended) {
    redirect("/login?suspended=1");
  }

  const { profile } = session;
  const parsed = onboardingSchema.safeParse({
    schoolId: formData.get("schoolId"),
    departmentId: formData.get("departmentId"),
    username: formData.get("username"),
    programme: formData.get("programme"),
    graduationYear: formData.get("graduationYear")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Check your onboarding details." };
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

  const graduationYear = typeof parsed.data.graduationYear === "number" ? parsed.data.graduationYear : null;
  try {
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        schoolId: parsed.data.schoolId,
        departmentId: parsed.data.departmentId,
        username: parsed.data.username ? parsed.data.username.toLowerCase() : null,
        programme: parsed.data.programme || null,
        graduationYear,
        onboardingCompleted: true
      }
    });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Unique constraint")
      ? "That username is already taken."
      : "Could not save onboarding right now.";
    return { ok: false, message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Onboarding complete. Opening your dashboard..." };
}

export async function suggestSchoolAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getCurrentProfile();
  if (!session) {
    redirect("/login");
  }

  if (session.profile.is_suspended) {
    redirect("/login?suspended=1");
  }

  const { profile } = session;
  const parsed = schoolSuggestionSchema.safeParse({
    name: formData.get("name"),
    country: formData.get("country") || "Nigeria",
    state: formData.get("state")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Check the school details." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("school_suggestions").insert({
    name: parsed.data.name,
    country: parsed.data.country,
    state: parsed.data.state || null,
    suggested_by: profile.id
  });

  return error
    ? { ok: false, message: "Could not submit this school suggestion." }
    : { ok: true, message: "School suggestion submitted for admin review." };
}
