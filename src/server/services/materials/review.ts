import "server-only";

import type { Prisma } from "@prisma/client";
import { getMonthlyCycle } from "@/lib/academic";
import { prisma } from "@/lib/prisma";
import { PermissionError, requireCourseModerator } from "@/server/auth/guards";

type ReviewInput = {
  materialId: string;
};

type RejectInput = ReviewInput & {
  reason: string;
};

export async function approveMaterial({ materialId }: ReviewInput) {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: {
      id: true,
      courseId: true,
      uploaderId: true,
      status: true
    }
  });

  if (!material) {
    throw new Error("Material not found.");
  }

  const { profile } = await requireCourseModerator(material.courseId);
  if (material.uploaderId === profile.id) {
    throw new PermissionError("You cannot approve your own upload.");
  }

  if (material.status !== "pending") {
    throw new Error("Only pending materials can be approved.");
  }

  const { cycleStart, cycleEnd } = getMonthlyCycle();
  const rewardSetting = await prisma.systemSetting.findUnique({
    where: { key: "approved_upload_reward" },
    select: { value: true }
  });
  const rewardValue = typeof rewardSetting?.value === "number" ? rewardSetting.value : 2;

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const approved = await tx.material.update({
      where: { id: material.id },
      data: {
        status: "approved",
        approvedBy: profile.id,
        approvedAt: new Date()
      }
    });

    await tx.uploadReward.upsert({
      where: { materialId: material.id },
      update: {},
      create: {
        userId: material.uploaderId,
        materialId: material.id,
        cycleStart,
        cycleEnd,
        creditsAwarded: rewardValue
      }
    });

    await tx.reputationEvent.upsert({
      where: { uniqueEventKey: `approved-upload:${material.id}` },
      update: {},
      create: {
        userId: material.uploaderId,
        eventType: "approved_upload",
        points: 10,
        entityType: "material",
        entityId: material.id,
        uniqueEventKey: `approved-upload:${material.id}`,
        description: "Material approved"
      }
    });

    return approved;
  });
}

export async function rejectMaterial({ materialId, reason }: RejectInput) {
  const cleanReason = reason.trim();
  if (cleanReason.length < 5) {
    throw new Error("A clear rejection reason is required.");
  }

  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: {
      id: true,
      courseId: true,
      uploaderId: true,
      status: true
    }
  });

  if (!material) {
    throw new Error("Material not found.");
  }

  const { profile } = await requireCourseModerator(material.courseId);
  if (material.uploaderId === profile.id) {
    throw new PermissionError("You cannot reject your own upload.");
  }

  if (material.status !== "pending") {
    throw new Error("Only pending materials can be rejected.");
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const rejected = await tx.material.update({
      where: { id: material.id },
      data: {
        status: "rejected",
        rejectionReason: cleanReason
      }
    });

    await tx.reputationEvent.upsert({
      where: { uniqueEventKey: `rejected-upload:${material.id}` },
      update: {},
      create: {
        userId: material.uploaderId,
        eventType: "rejected_upload",
        points: -5,
        entityType: "material",
        entityId: material.id,
        uniqueEventKey: `rejected-upload:${material.id}`,
        description: "Material rejected"
      }
    });

    return rejected;
  });
}
