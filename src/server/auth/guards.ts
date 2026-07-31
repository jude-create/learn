import "server-only";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/database";

export class PermissionError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "PermissionError";
  }
}

export async function requireUser() {
  const session = await getCurrentProfile();
  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireActiveUser() {
  const session = await requireUser();
  if (session.profile.is_suspended) {
    redirect("/login?suspended=1");
  }

  if (!session.profile.onboarding_completed && session.profile.role !== "admin") {
    redirect("/onboarding");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireActiveUser();
  if (session.profile.role !== "admin") {
    throw new PermissionError("Admin access is required.");
  }

  return session;
}

export async function requireRole(role: UserRole) {
  const session = await requireActiveUser();
  if (session.profile.role !== role) {
    throw new PermissionError(`${role} access is required.`);
  }

  return session;
}

export async function requireResourceOwner(resourceUserId: string) {
  const session = await requireActiveUser();
  if (session.profile.id !== resourceUserId && session.profile.role !== "admin") {
    throw new PermissionError("You can manage only your own resources.");
  }

  return session;
}

export async function requireCourseModerator(courseId: string) {
  const session = await requireActiveUser();
  if (session.profile.role === "admin") {
    return session;
  }

  const assignment = await prisma.courseModerator.findFirst({
    where: {
      courseId,
      userId: session.profile.id,
      isActive: true,
      removedAt: null
    },
    select: { id: true }
  });

  if (!assignment) {
    throw new PermissionError("You can moderate only assigned courses.");
  }

  return session;
}
