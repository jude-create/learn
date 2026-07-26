"use client";

export function AuthFormMessage({ message, ok }: { message?: string; ok?: boolean }) {
  if (!message) {
    return null;
  }

  return (
    <p className={ok ? "text-sm text-emerald-700" : "text-sm text-destructive"} role="status">
      {message}
    </p>
  );
}
