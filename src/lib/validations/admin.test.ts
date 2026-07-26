import { describe, expect, it } from "vitest";
import { adminCommentActionSchema, adminCourseActionSchema, adminUserSuspensionSchema } from "@/lib/validations/admin";

describe("admin validation", () => {
  it("validates user suspension input", () => {
    const result = adminUserSuspensionSchema.safeParse({
      userId: "00000000-0000-0000-0000-000000000021",
      isSuspended: true
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid user ids", () => {
    const result = adminUserSuspensionSchema.safeParse({
      userId: "not-a-user-id",
      isSuspended: true
    });

    expect(result.success).toBe(false);
  });

  it("validates course and comment action identifiers", () => {
    expect(adminCourseActionSchema.safeParse({ courseId: "10000000-0000-0000-0000-000000000001" }).success).toBe(true);
    expect(adminCommentActionSchema.safeParse({ commentId: "40000000-0000-0000-0000-000000000001" }).success).toBe(true);
  });
});
