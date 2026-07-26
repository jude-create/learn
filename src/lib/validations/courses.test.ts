import { describe, expect, it } from "vitest";
import { courseFormSchema } from "@/lib/validations/courses";

describe("course validation", () => {
  it("accepts a valid course draft payload", () => {
    const result = courseFormSchema.safeParse({
      title: "React Fundamentals",
      description: "A practical course that teaches React components, props, state and effects through real interfaces.",
      category: "React",
      level: "beginner",
      thumbnailUrl: ""
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported levels", () => {
    const result = courseFormSchema.safeParse({
      title: "React Fundamentals",
      description: "A practical course that teaches React components, props, state and effects through real interfaces.",
      category: "React",
      level: "expert",
      thumbnailUrl: ""
    });

    expect(result.success).toBe(false);
  });
});
