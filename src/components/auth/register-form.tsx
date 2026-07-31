"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { registerAction } from "@/lib/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { PasswordInput } from "@/components/auth/password-input";

const initialState = { ok: false, message: "" };

export function RegisterForm() {
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const form = useForm<RegisterInput>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  function onSubmit(values: RegisterInput) {
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const issue = parsed.error.errors[0];
      if (issue?.path[0]) {
        form.setError(issue.path[0] as keyof RegisterInput, { message: issue.message });
      } else {
        setState({ ok: false, message: issue?.message ?? "Check your details." });
      }
      return;
    }

    const formData = new FormData();
    formData.set("fullName", parsed.data.fullName);
    formData.set("email", parsed.data.email);
    formData.set("password", parsed.data.password);
    formData.set("confirmPassword", parsed.data.confirmPassword);
    startTransition(async () => {
      const result = await registerAction(initialState, formData);
      setState(result);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
        {form.formState.errors.fullName ? <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" autoComplete="new-password" {...form.register("password")} />
        {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordInput id="confirmPassword" autoComplete="new-password" {...form.register("confirmPassword")} />
        {form.formState.errors.confirmPassword ? <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p> : null}
      </div>
      <AuthFormMessage message={state.message} ok={state.ok} />
      <Button className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {pending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
