import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">Enter a secure password to regain access.</p>
      <ResetPasswordForm />
    </div>
  );
}
