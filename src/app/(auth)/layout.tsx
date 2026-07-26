import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-muted px-4 py-8">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-lg font-bold">
          <GraduationCap className="h-6 w-6 text-primary" aria-hidden />
          Learn Big
        </Link>
        <div className="rounded-md border border-border bg-background p-6 shadow-soft">{children}</div>
      </div>
    </main>
  );
}
