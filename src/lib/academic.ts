export const allowedMaterialExtensions = ["pdf", "ppt", "pptx", "doc", "docx", "txt", "png", "jpg", "jpeg", "webp"] as const;

export const allowedMaterialMimeTypes = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp"
] as const;

export function normaliseCourseCode(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function formatCourseCode(value: string) {
  const normalised = normaliseCourseCode(value);
  const match = normalised.match(/^([A-Z]+)([0-9]+[A-Z]?)$/);
  return match ? `${match[1]} ${match[2]}` : normalised;
}

export type DatabaseSemesterValue = "first" | "second" | "summer" | "full-year";

export function toPrismaSemester(value: string | null | undefined): DatabaseSemesterValue | null {
  if (!value) {
    return null;
  }

  if (value === "full_year") {
    return "full-year";
  }

  if (value === "first" || value === "second" || value === "summer" || value === "full-year") {
    return value;
  }

  return null;
}

export function formatSemester(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.replace("_", " ").replace("-", " ");
}

export function getMonthlyCycle(now = new Date()) {
  const cycleStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const cycleEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { cycleStart, cycleEnd };
}

type DownloadAllowanceInput = {
  baseDownloads?: number;
  approvedUploads: number;
  rewardPerUpload?: number;
  maximumMonthlyBonus?: number | null;
  downloadsUsed: number;
};

export function calculateDownloadAllowance({
  baseDownloads = 5,
  approvedUploads,
  rewardPerUpload = 2,
  maximumMonthlyBonus = 10,
  downloadsUsed
}: DownloadAllowanceInput) {
  const rawBonus = Math.max(approvedUploads, 0) * Math.max(rewardPerUpload, 0);
  const uploadBonus = maximumMonthlyBonus === null ? rawBonus : Math.min(rawBonus, maximumMonthlyBonus);
  const totalCredits = Math.max(baseDownloads, 0) + uploadBonus;

  return {
    baseDownloads: Math.max(baseDownloads, 0),
    uploadBonus,
    downloadsUsed: Math.max(downloadsUsed, 0),
    downloadsRemaining: Math.max(totalCredits - Math.max(downloadsUsed, 0), 0)
  };
}

export function isAllowedMaterialFile(fileName: string, mimeType: string, fileSize: number, maxSizeMb = 25) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const hasAllowedExtension = Boolean(extension && allowedMaterialExtensions.includes(extension as typeof allowedMaterialExtensions[number]));
  const hasAllowedMimeType = allowedMaterialMimeTypes.includes(mimeType as typeof allowedMaterialMimeTypes[number]);
  const isWithinSize = fileSize > 0 && fileSize <= maxSizeMb * 1024 * 1024;

  return hasAllowedExtension && hasAllowedMimeType && isWithinSize;
}
