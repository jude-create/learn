import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CourseCard } from "@/components/academic/course-card";
import { EmptyState } from "@/components/ui/empty-state";

type DepartmentPageProps = {
  params: Promise<{ schoolSlug: string; departmentSlug: string }>;
};

export default async function DepartmentPage({ params }: DepartmentPageProps) {
  const { schoolSlug, departmentSlug } = await params;
  const department = await prisma.department.findFirst({
    where: {
      slug: departmentSlug,
      school: {
        slug: schoolSlug,
        isVerified: true
      }
    },
    include: {
      school: true,
      academicCourses: {
        where: { status: "active" },
        orderBy: { normalisedCourseCode: "asc" },
        include: {
          _count: {
            select: {
              materials: true,
              discussionThreads: true
            }
          }
        }
      }
    }
  });

  if (!department) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href={`/schools/${department.school.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {department.school.name}
      </Link>
      <h1 className="mt-5 text-3xl font-bold">{department.name}</h1>
      <p className="mt-2 text-muted-foreground">Browse course hubs, materials and discussions for this department.</p>

      {department.academicCourses.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No active courses yet" description="A student or Admin can suggest the first course for this department." />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {department.academicCourses.map((course) => (
            <CourseCard key={course.id} schoolSlug={department.school.slug} course={course} />
          ))}
        </div>
      )}
    </main>
  );
}
