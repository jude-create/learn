import Link from "next/link";
import { BookOpen, FileText, GraduationCap, MessageSquareText, Search } from "lucide-react";
import { normaliseCourseCode, toPrismaSemester } from "@/lib/academic";
import { prisma } from "@/lib/prisma";
import { academicSearchSchema } from "@/lib/validations/academic";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    school?: string;
    department?: string;
    type?: string;
    semester?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawParams = await searchParams;
  const parsed = academicSearchSchema.safeParse(rawParams);
  const params = parsed.success ? parsed.data : {};
  const q = params.q?.trim();
  const normalisedCode = q ? normaliseCourseCode(q) : "";
  const semester = toPrismaSemester(params.semester);

  const [schools, courses, materials, discussions] = await Promise.all([
    prisma.school.findMany({
      where: {
        isVerified: true,
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {})
      },
      orderBy: { name: "asc" },
      take: 6
    }),
    prisma.academicCourse.findMany({
      where: {
        status: "active",
        ...(params.school ? { school: { slug: params.school } } : {}),
        ...(params.department ? { department: { slug: params.department } } : {}),
        ...(semester ? { semester } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { courseCode: { contains: q, mode: "insensitive" } },
                { normalisedCourseCode: { contains: normalisedCode } }
              ]
            }
          : {})
      },
      include: { school: true, department: true },
      orderBy: { updatedAt: "desc" },
      take: 10
    }),
    prisma.material.findMany({
      where: {
        status: "approved",
        ...(params.type ? { materialType: params.type } : {}),
        ...(semester ? { semester } : {}),
        ...(params.school ? { course: { school: { slug: params.school } } } : {}),
        ...(params.department ? { course: { department: { slug: params.department } } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { originalFileName: { contains: q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      include: { course: { include: { school: true, department: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.discussionThread.findMany({
      where: {
        ...(params.school ? { course: { school: { slug: params.school } } } : {}),
        ...(params.department ? { course: { department: { slug: params.department } } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { body: { contains: q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      include: { course: { include: { school: true } }, _count: { select: { answers: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);

  const hasResults = schools.length + courses.length + materials.length + discussions.length > 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Search Learn Big</h1>
        <p className="mt-2 text-muted-foreground">Find schools, course hubs, approved materials and course discussions.</p>
      </div>

      <form className="mt-8 grid gap-3 rounded-md border border-border p-4 md:grid-cols-[1fr_160px_160px_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by title, course code or keyword"
          />
        </label>
        <input className="h-10 rounded-md border border-border px-3 text-sm" name="school" defaultValue={params.school ?? ""} placeholder="School slug" />
        <select className="h-10 rounded-md border border-border px-3 text-sm" name="type" defaultValue={params.type ?? ""}>
          <option value="">Any material</option>
          <option value="notes">Notes</option>
          <option value="lecture_slides">Lecture slides</option>
          <option value="past_exam">Past exam</option>
          <option value="assignment">Assignment</option>
          <option value="tutorial">Tutorial</option>
          <option value="project_resource">Project resource</option>
          <option value="study_guide">Study guide</option>
          <option value="other">Other</option>
        </select>
        <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
          Search
        </button>
      </form>

      {!hasResults ? (
        <div className="mt-8">
          <EmptyState title="No results yet" description="Try a broader search or browse schools from the navigation." />
        </div>
      ) : (
        <div className="mt-8 grid gap-6">
          <ResultSection title="Schools" icon={<GraduationCap className="h-5 w-5" aria-hidden />}>
            {schools.map((school) => (
              <Link key={school.id} href={`/schools/${school.slug}`} className="rounded-md border border-border p-4 hover:bg-muted">
                <h2 className="font-semibold">{school.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{school.state ? `${school.state}, ${school.country}` : school.country}</p>
              </Link>
            ))}
          </ResultSection>

          <ResultSection title="Courses" icon={<BookOpen className="h-5 w-5" aria-hidden />}>
            {courses.map((course) => (
              <Link key={course.id} href={`/schools/${course.school.slug}/courses/${course.slug}`} className="rounded-md border border-border p-4 hover:bg-muted">
                <Badge>{course.courseCode}</Badge>
                <h2 className="mt-3 font-semibold">{course.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{course.school.name} / {course.department.name}</p>
              </Link>
            ))}
          </ResultSection>

          <ResultSection title="Materials" icon={<FileText className="h-5 w-5" aria-hidden />}>
            {materials.map((material) => (
              <Link key={material.id} href={`/materials/${material.id}`} className="rounded-md border border-border p-4 hover:bg-muted">
                <Badge>{material.materialType.replace("_", " ")}</Badge>
                <h2 className="mt-3 font-semibold">{material.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{material.course.courseCode} / {material.course.school.name}</p>
              </Link>
            ))}
          </ResultSection>

          <ResultSection title="Discussions" icon={<MessageSquareText className="h-5 w-5" aria-hidden />}>
            {discussions.map((discussion) => (
              <Link key={discussion.id} href={`/discussions/${discussion.id}`} className="rounded-md border border-border p-4 hover:bg-muted">
                <h2 className="font-semibold">{discussion.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{discussion.course.courseCode} / {discussion._count.answers} answers</p>
              </Link>
            ))}
          </ResultSection>
        </div>
      )}
    </main>
  );
}

function ResultSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}
