import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Reset password</h1>
      <p className="mt-2 text-sm text-muted-foreground">We will send a reset link to your email.</p>
      <ForgotPasswordForm />
    </div>
  );
}
