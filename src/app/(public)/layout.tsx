import Link from "next/link";
import { BookOpen, GraduationCap, Map, MessageSquareText } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { getRoleDashboard } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentProfile();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" aria-hidden />
            </span>
            Learn Big
          </Link>
          <nav className="flex items-center gap-2">
            <Link className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline" href="/">
              Home
            </Link>
            <Link className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline" href="/schools">
              Schools
            </Link>
            <Link className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline" href="/search">
              Search
            </Link>
            {session ? (
              <>
                <Link href={getRoleDashboard(session.profile.role)}>
                  <Button variant="secondary">Dashboard</Button>
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>
                    <BookOpen className="h-4 w-4" aria-hidden />
                    Register
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-border bg-foreground text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" aria-hidden />
              </span>
              Learn Big
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-primary-foreground/70">
              A collaborative academic space for school course hubs, student materials and useful discussions.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Explore</h2>
            <div className="mt-4 grid gap-3 text-sm text-primary-foreground/70">
              <Link className="hover:text-primary-foreground" href="/">Home</Link>
              <Link className="hover:text-primary-foreground" href="/schools">Browse schools</Link>
              <Link className="hover:text-primary-foreground" href="/search">Search resources</Link>
              <Link className="hover:text-primary-foreground" href="/register">Create account</Link>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Subjects</h2>
            <div className="mt-4 grid gap-3 text-sm text-primary-foreground/70">
              <span>Computer Science</span>
              <span>Mathematics</span>
              <span>Engineering</span>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Platform</h2>
            <div className="mt-4 grid gap-3 text-sm text-primary-foreground/70">
              <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" aria-hidden /> Materials</span>
              <span className="inline-flex items-center gap-2"><MessageSquareText className="h-4 w-4" aria-hidden /> Discussions</span>
              <span className="inline-flex items-center gap-2"><Map className="h-4 w-4" aria-hidden /> Course hubs</span>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-sm text-primary-foreground/60 sm:flex-row sm:items-center sm:justify-between">
            <p>Learn Big MVP. Built for students and educators.</p>
            <p>Schools, materials, discussions and reputation in one place.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
