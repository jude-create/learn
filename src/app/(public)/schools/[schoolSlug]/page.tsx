import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Building2, GraduationCap, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CourseCard } from "@/components/academic/course-card";
import { CourseSuggestionForm } from "@/components/academic/course-suggestion-form";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

type SchoolPageProps = {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ q?: string; department?: string }>;
};

export default async function SchoolPage({ params, searchParams }: SchoolPageProps) {
  const [{ schoolSlug }, queryParams] = await Promise.all([params, searchParams]);
  const q = queryParams.q?.trim();
  const departmentSlug = queryParams.department?.trim();
  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    include: {
      departments: {
        orderBy: { name: "asc" },
        include: { _count: { select: { academicCourses: true } } }
      }
    }
  });

  if (!school || !school.isVerified) {
    notFound();
  }

  const courses = await prisma.academicCourse.findMany({
    where: {
      schoolId: school.id,
      status: "active",
      ...(departmentSlug ? { department: { slug: departmentSlug } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { courseCode: { contains: q, mode: "insensitive" } },
              { normalisedCourseCode: { contains: q.replace(/[^a-z0-9]/gi, "").toUpperCase() } }
            ]
          }
        : {})
    },
    orderBy: [{ department: { name: "asc" } }, { normalisedCourseCode: "asc" }],
    include: {
      department: true,
      _count: {
        select: {
          materials: true,
          discussionThreads: true
        }
      }
    },
    take: 24
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <Badge>{school.country}</Badge>
          <h1 className="mt-4 text-3xl font-bold">{school.name}</h1>
          <p className="mt-2 text-muted-foreground">{school.state ? `${school.state} state` : "Verified academic community"}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Building2 className="h-4 w-4" aria-hidden />
              {school.departments.length} departments
            </span>
            <span className="inline-flex items-center gap-2">
              <GraduationCap className="h-4 w-4" aria-hidden />
              {courses.length} matching courses
            </span>
          </div>
        </div>
        <div className="rounded-md border border-border bg-muted/40 p-4">
          <h2 className="font-semibold">Departments</h2>
          <div className="mt-3 grid gap-2">
            {school.departments.map((department) => (
              <Link
                key={department.id}
                href={`/schools/${school.slug}/departments/${department.slug}`}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-background"
              >
                <span>{department.name}</span>
                <span className="text-muted-foreground">{department._count.academicCourses}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <form className="mt-8 grid gap-3 rounded-md border border-border p-4 md:grid-cols-[1fr_220px_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search course code or title"
          />
        </label>
        <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" name="department" defaultValue={departmentSlug ?? ""}>
          <option value="">All departments</option>
          {school.departments.map((department) => (
            <option key={department.id} value={department.slug}>
              {department.name}
            </option>
          ))}
        </select>
        <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
          Filter
        </button>
      </form>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-xl font-semibold">Course hubs</h2>
        </div>
        {courses.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No course hubs found" description="Try another department or suggest a missing course." />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <CourseCard key={course.id} schoolSlug={school.slug} course={course} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <CourseSuggestionForm
          schoolId={school.id}
          departments={school.departments.map((department) => ({
            id: department.id,
            schoolId: department.schoolId,
            name: department.name
          }))}
        />
      </section>
    </main>
  );
}
