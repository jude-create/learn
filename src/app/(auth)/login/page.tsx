import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suspended?: string; error?: string; redirectTo?: string }> }) {
  const params = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="mt-2 text-sm text-muted-foreground">Welcome back to your academic community.</p>
      {params.suspended ? (
        <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          This account is suspended. Contact an administrator.
        </p>
      ) : null}
      {params.error === "google" ? (
        <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Google sign-in could not start. Check your authentication settings.
        </p>
      ) : null}
      <div className="mt-6">
        <GoogleSignInButton />
      </div>
      <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or use email
        <span className="h-px flex-1 bg-border" />
      </div>
      <LoginForm redirectTo={params.redirectTo ?? "/dashboard"} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
