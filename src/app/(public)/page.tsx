import Link from "next/link";
import { ArrowRight, BookOpen, Building2, FileText, MessageSquareText, Search, ShieldCheck, UploadCloud, Users } from "lucide-react";
import { formatCourseCode } from "@/lib/academic";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

const platformHighlights = [
  {
    title: "School course hubs",
    description: "Browse by school, department and academic course code.",
    icon: Building2
  },
  {
    title: "Student materials",
    description: "Upload notes, slides, past questions and study guides into the right course.",
    icon: FileText
  },
  {
    title: "Course discussions",
    description: "Ask questions, answer classmates and surface useful explanations through votes.",
    icon: MessageSquareText
  }
];

const workflowItems: { title: string; description: string; icon: LucideIcon }[] = [
  { title: "Browse", description: "Find courses by school, department and course code.", icon: BookOpen },
  { title: "Upload", description: "Share useful files into the correct course hub.", icon: UploadCloud },
  { title: "Discuss", description: "Ask and answer course-specific questions.", icon: Users },
  { title: "Moderate", description: "Course moderators review uploads and flags.", icon: ShieldCheck }
];

export default async function LandingPage() {
  const [schools, courses] = await Promise.all([
    prisma.school.findMany({
      where: { isVerified: true },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            departments: true,
            academicCourses: true
          }
        }
      },
      take: 3
    }),
    prisma.academicCourse.findMany({
      where: { status: "active" },
      include: {
        school: true,
        department: true,
        _count: {
          select: {
            materials: true,
            discussionThreads: true
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 3
    })
  ]);

  return (
    <main>
      <section className="border-b border-border bg-[linear-gradient(135deg,#f8fafc_0%,#eef7f5_52%,#fff7ed_100%)]">
        <div className="mx-auto grid min-h-[540px] max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <Badge>Academic materials, course questions and reputation</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-normal text-foreground sm:text-6xl">
              Learn Big
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              A student-powered hub for Nigerian university courses, where classmates share resources, discuss coursework and build trust through useful contributions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/schools">
                <Button>
                  Browse schools
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="secondary">
                  <Search className="h-4 w-4" aria-hidden />
                  Search resources
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid gap-4 rounded-lg border border-white/80 bg-white/85 p-4 shadow-soft backdrop-blur">
            {platformHighlights.map((item) => (
              <div key={item.title} className="flex gap-3 rounded-md border border-border bg-background/80 p-4">
                <item.icon className="mt-1 h-5 w-5 text-primary" aria-hidden />
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Featured schools</h2>
            <p className="mt-2 text-muted-foreground">Start from your school community and move into departments and course hubs.</p>
          </div>
          <Link href="/schools" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {schools.map((school) => (
            <Link key={school.id} href={`/schools/${school.slug}`} className="rounded-md border border-border bg-background p-5 transition hover:shadow-soft">
              <Building2 className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">{school.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{school.state ? `${school.state}, ${school.country}` : school.country}</p>
              <p className="mt-4 text-sm font-medium text-primary">
                {school._count.departments} departments / {school._count.academicCourses} courses
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Recent course hubs</h2>
              <p className="mt-2 text-muted-foreground">Academic containers for materials and discussions, not uploads masquerading as courses.</p>
            </div>
            <Link href="/search" className="text-sm font-semibold text-primary hover:underline">
              Search
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {courses.map((course) => (
              <Link key={course.id} href={`/schools/${course.school.slug}/courses/${course.slug}`} className="rounded-md border border-border bg-background p-5 transition hover:shadow-soft">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary/10 text-primary">{formatCourseCode(course.courseCode)}</Badge>
                  <Badge>{course.department.name}</Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{course.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{course.school.name}</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  {course._count.materials} materials / {course._count.discussionThreads} discussions
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-4">
        {workflowItems.map((item) => (
          <div key={item.title} className="flex gap-3">
            <item.icon className="mt-1 h-5 w-5 text-primary" aria-hidden />
            <div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
