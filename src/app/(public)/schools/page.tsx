import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SchoolCard } from "@/components/academic/school-card";
import { EmptyState } from "@/components/ui/empty-state";

type SchoolsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SchoolsPage({ searchParams }: SchoolsPageProps) {
  const { q } = await searchParams;
  const query = q?.trim();
  const schools = await prisma.school.findMany({
    where: {
      isVerified: true,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { state: { contains: query, mode: "insensitive" } },
              { country: { contains: query, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          departments: true,
          academicCourses: true
        }
      }
    }
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Browse schools</h1>
        <p className="max-w-2xl text-muted-foreground">
          Start with a school, then drill into departments, course hubs, materials and discussions.
        </p>
      </div>

      <form className="mt-8 flex max-w-xl gap-3 rounded-md border border-border p-3">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            name="q"
            defaultValue={query ?? ""}
            placeholder="Search schools"
          />
        </label>
        <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
          Search
        </button>
      </form>

      {schools.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No schools found" description="Try a different school name, state or country." />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schools.map((school) => (
            <SchoolCard
              key={school.id}
              name={school.name}
              slug={school.slug}
              state={school.state}
              country={school.country}
              departmentCount={school._count.departments}
              courseCount={school._count.academicCourses}
            />
          ))}
        </div>
      )}
    </main>
  );
}
