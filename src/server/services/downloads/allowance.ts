import "server-only";

import { calculateDownloadAllowance, getMonthlyCycle } from "@/lib/academic";
import { prisma } from "@/lib/prisma";

const settingKeys = [
  "base_monthly_downloads",
  "approved_upload_reward",
  "maximum_monthly_upload_bonus"
] as const;

function readIntegerSetting(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value);
  }

  return fallback;
}

export async function getDownloadAllowance(userId: string, now = new Date()) {
  const { cycleStart, cycleEnd } = getMonthlyCycle(now);
  const [settings, rewards, downloads] = await Promise.all([
    prisma.systemSetting.findMany({
      where: { key: { in: [...settingKeys] } },
      select: { key: true, value: true }
    }),
    prisma.uploadReward.aggregate({
      where: { userId, cycleStart },
      _sum: { creditsAwarded: true }
    }),
    prisma.downloadEvent.aggregate({
      where: { userId, cycleStart },
      _sum: { creditConsumed: true }
    })
  ]);

  const settingsByKey = new Map(
    settings.map((setting: { key: string; value: unknown }) => [setting.key, setting.value])
  );
  const baseDownloads = readIntegerSetting(settingsByKey.get("base_monthly_downloads"), 5);
  const rewardPerUpload = readIntegerSetting(settingsByKey.get("approved_upload_reward"), 2);
  const maximumMonthlyBonus = readIntegerSetting(settingsByKey.get("maximum_monthly_upload_bonus"), 10);
  const uploadBonusCredits = rewards._sum.creditsAwarded ?? 0;
  const approvedUploads = rewardPerUpload > 0 ? Math.floor(uploadBonusCredits / rewardPerUpload) : 0;

  return {
    ...calculateDownloadAllowance({
      baseDownloads,
      approvedUploads,
      rewardPerUpload,
      maximumMonthlyBonus,
      downloadsUsed: downloads._sum.creditConsumed ?? 0
    }),
    cycleStart,
    cycleEnd
  };
}
