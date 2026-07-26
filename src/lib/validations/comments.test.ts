import { describe, expect, it } from "vitest";
import { commentSchema } from "@/lib/validations/comments";

describe("comment validation", () => {
  it("rejects empty comments", () => {
    const result = commentSchema.safeParse({
      lessonId: "30000000-0000-0000-0000-000000000001",
      content: " "
    });

    expect(result.success).toBe(false);
  });

  it("accepts a main comment", () => {
    const result = commentSchema.safeParse({
      lessonId: "30000000-0000-0000-0000-000000000001",
      content: "This lesson clarified state management."
    });

    expect(result.success).toBe(true);
  });

  it("accepts only one parent identifier for replies", () => {
    const result = commentSchema.safeParse({
      lessonId: "30000000-0000-0000-0000-000000000001",
      parentCommentId: "40000000-0000-0000-0000-000000000001",
      content: "That explanation helped me too."
    });

    expect(result.success).toBe(true);
  });
});
