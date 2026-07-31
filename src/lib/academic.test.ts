import { describe, expect, it } from "vitest";
import { calculateDownloadAllowance, formatCourseCode, getMonthlyCycle, isAllowedMaterialFile, normaliseCourseCode } from "./academic";

describe("academic utilities", () => {
  it("normalises equivalent course code formats", () => {
    expect(normaliseCourseCode("CSC301")).toBe("CSC301");
    expect(normaliseCourseCode("CSC 301")).toBe("CSC301");
    expect(normaliseCourseCode("csc-301")).toBe("CSC301");
  });

  it("formats normalised course codes for display", () => {
    expect(formatCourseCode("csc-301")).toBe("CSC 301");
  });

  it("calculates UTC calendar-month cycles", () => {
    const cycle = getMonthlyCycle(new Date("2026-07-30T23:30:00.000Z"));
    expect(cycle.cycleStart.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(cycle.cycleEnd.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });

  it("calculates capped download allowance", () => {
    expect(calculateDownloadAllowance({ approvedUploads: 7, downloadsUsed: 8 })).toEqual({
      baseDownloads: 5,
      uploadBonus: 10,
      downloadsUsed: 8,
      downloadsRemaining: 7
    });
  });

  it("validates extension, MIME type and size together", () => {
    expect(isAllowedMaterialFile("notes.pdf", "application/pdf", 1024)).toBe(true);
    expect(isAllowedMaterialFile("script.exe", "application/pdf", 1024)).toBe(false);
    expect(isAllowedMaterialFile("notes.pdf", "application/x-msdownload", 1024)).toBe(false);
    expect(isAllowedMaterialFile("notes.pdf", "application/pdf", 26 * 1024 * 1024)).toBe(false);
  });
});
