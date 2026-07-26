import Link from "next/link";
import { BookOpen, Compass, GraduationCap, Home, LayoutDashboard, Shield, Users } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/logout-button";

const navByRole = {
  student: [
    { href: "/", label: "Home", icon: Home },
    { href: "/courses", label: "Browse courses", icon: Compass },
    { href: "/dashboard/student", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/student/courses", label: "My courses", icon: BookOpen }
  ],
  instructor: [
    { href: "/", label: "Home", icon: Home },
    { href: "/courses", label: "Browse courses", icon: Compass },
    { href: "/dashboard/instructor", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/instructor/courses", label: "Courses", icon: BookOpen }
  ],
  admin: [
    { href: "/", label: "Home", icon: Home },
    { href: "/courses", label: "Browse courses", icon: Compass },
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/courses", label: "Courses", icon: BookOpen },
    { href: "/dashboard/admin/comments", label: "Comments", icon: Shield }
  ]
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  const nav = navByRole[profile.role];

  return (
    <div className="min-h-screen bg-muted md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-b border-border bg-background md:min-h-screen md:border-b-0 md:border-r">
        <div className="flex h-16 items-center justify-between px-4 md:h-auto md:flex-col md:items-stretch md:gap-6 md:py-5">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" aria-hidden />
            </span>
            Learn Big
          </Link>
          <nav className="hidden gap-1 md:flex md:flex-col">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="md:mt-auto">
            <LogoutButton />
          </div>
        </div>
      </aside>
      <section>
        <header className="border-b border-border bg-background px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Workspace</p>
              <h1 className="text-xl font-semibold">{profile.full_name}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/" className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                <Home className="h-4 w-4" aria-hidden />
                Home
              </Link>
              <Link href="/courses" className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                <Compass className="h-4 w-4" aria-hidden />
                Browse courses
              </Link>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </section>
    </div>
  );
}
