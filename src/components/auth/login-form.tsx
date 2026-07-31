"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { PasswordInput } from "@/components/auth/password-input";

const initialState = { ok: false, message: "" };

export function LoginForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const form = useForm<LoginInput>({
    defaultValues: { email: "", password: "" }
  });

  function onSubmit(values: LoginInput) {
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const issue = parsed.error.errors[0];
      if (issue?.path[0]) {
        form.setError(issue.path[0] as keyof LoginInput, { message: issue.message });
      } else {
        setState({ ok: false, message: issue?.message ?? "Check your details." });
      }
      return;
    }

    const formData = new FormData();
    formData.set("email", parsed.data.email);
    formData.set("password", parsed.data.password);
    formData.set("redirectTo", redirectTo);
    startTransition(async () => {
      const result = await loginAction(initialState, formData);
      setState(result);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" autoComplete="current-password" {...form.register("password")} />
        {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
      </div>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <AuthFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <Button className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {pending ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
}
