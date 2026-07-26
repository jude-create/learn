import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("auth validation", () => {
  it("allows students and instructors to register", () => {
    const result = registerSchema.safeParse({
      fullName: "Taylor Reed",
      email: "taylor@example.com",
      password: "password123",
      confirmPassword: "password123",
      role: "student"
    });

    expect(result.success).toBe(true);
  });

  it("rejects admin registration", () => {
    const result = registerSchema.safeParse({
      fullName: "Avery Admin",
      email: "admin@example.com",
      password: "password123",
      confirmPassword: "password123",
      role: "admin"
    });

    expect(result.success).toBe(false);
  });

  it("requires matching passwords", () => {
    const result = registerSchema.safeParse({
      fullName: "Taylor Reed",
      email: "taylor@example.com",
      password: "password123",
      confirmPassword: "password456",
      role: "instructor"
    });

    expect(result.success).toBe(false);
  });

  it("validates login credentials shape", () => {
    expect(loginSchema.safeParse({ email: "bad-email", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "learner@example.com", password: "secret" }).success).toBe(true);
  });
});
