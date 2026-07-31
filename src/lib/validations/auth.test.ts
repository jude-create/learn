import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

describe("auth validation", () => {
  it("allows students to register without choosing a role", () => {
    const result = registerSchema.safeParse({
      fullName: "Taylor Reed",
      email: "taylor@example.com",
      password: "password123",
      confirmPassword: "password123"
    });

    expect(result.success).toBe(true);
  });

  it("does not include client-provided roles in registration data", () => {
    const result = registerSchema.safeParse({
      fullName: "Avery Admin",
      email: "admin@example.com",
      password: "password123",
      confirmPassword: "password123",
      role: "admin"
    });

    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty("role");
  });

  it("requires matching passwords", () => {
    const result = registerSchema.safeParse({
      fullName: "Taylor Reed",
      email: "taylor@example.com",
      password: "password123",
      confirmPassword: "password456"
    });

    expect(result.success).toBe(false);
  });

  it("validates login credentials shape", () => {
    expect(loginSchema.safeParse({ email: "bad-email", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "learner@example.com", password: "secret" }).success).toBe(true);
  });
});
