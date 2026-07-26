import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { courseSearchSchema } from "@/lib/validations/courses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type CoursesPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    level?: string;
    page?: string;
  }>;
};

const pageSize = 9;

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const rawParams = await searchParams;
  const parsed = courseSearchSchema.safeParse(rawParams);
  const params = parsed.success ? parsed.data : {};
  const currentPage = params.page ?? 1;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("courses")
    .select("id,title,slug,description,category,level,thumbnail_url,created_at", { count: "exact" })
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%,category.ilike.%${params.q}%`);
  }

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (params.level && ["beginner", "intermediate", "advanced"].includes(params.level)) {
    query = query.eq("level", params.level);
  }

  const { data: courses, error, count } = await query.range(from, to);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Browse courses</h1>
        <p className="text-muted-foreground">
          Search coding topics, secondary school subjects and university courses by title, category and level.
        </p>
      </div>

      <form className="mt-8 grid gap-3 rounded-md border border-border p-4 md:grid-cols-[1fr_180px_180px_auto]">
        <input
          className="h-10 rounded-md border border-border px-3 text-sm"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search courses"
        />
        <input
          className="h-10 rounded-md border border-border px-3 text-sm"
          name="category"
          defaultValue={params.category ?? ""}
          placeholder="Category"
        />
        <select className="h-10 rounded-md border border-border px-3 text-sm" name="level" defaultValue={params.level ?? ""}>
          <option value="">Any level</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
          <Search className="h-4 w-4" aria-hidden />
          Search
        </button>
      </form>

      {error ? (
        <div className="mt-8 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Could not load courses right now. Please try again in a moment.
        </div>
      ) : null}

      {!error && (courses ?? []).length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No courses found" description="Try a different search or filter." />
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(courses ?? []).map((course) => (
          <Link key={course.id} href={`/courses/${course.slug}`} className="overflow-hidden rounded-md border border-border transition hover:shadow-soft">
            <div className="aspect-[16/9] bg-muted">
              {course.thumbnail_url ? (
                <Image src={course.thumbnail_url} alt="" width={640} height={360} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">{course.category}</div>
              )}
            </div>
            <div className="p-5">
              <Badge>{course.level}</Badge>
              <h2 className="mt-4 text-lg font-semibold">{course.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
              <p className="mt-4 text-sm font-medium text-primary">{course.category}</p>
            </div>
          </Link>
        ))}
      </div>

      {!error && totalPages > 1 ? (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Course pages">
          <PaginationLink page={Math.max(1, currentPage - 1)} disabled={currentPage <= 1} params={params} label="Previous" icon="left" />
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <PaginationLink page={Math.min(totalPages, currentPage + 1)} disabled={currentPage >= totalPages} params={params} label="Next" icon="right" />
        </nav>
      ) : null}
    </main>
  );
}

function PaginationLink({
  page,
  disabled,
  params,
  label,
  icon
}: {
  page: number;
  disabled: boolean;
  params: { q?: string; category?: string; level?: "beginner" | "intermediate" | "advanced"; page?: number };
  label: string;
  icon: "left" | "right";
}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.level) search.set("level", params.level);
  search.set("page", String(page));

  if (disabled) {
    return (
      <Button variant="secondary" disabled>
        {icon === "left" ? <ChevronLeft className="h-4 w-4" aria-hidden /> : null}
        {label}
        {icon === "right" ? <ChevronRight className="h-4 w-4" aria-hidden /> : null}
      </Button>
    );
  }

  return (
    <Link href={`/courses?${search.toString()}`}>
      <Button variant="secondary">
        {icon === "left" ? <ChevronLeft className="h-4 w-4" aria-hidden /> : null}
        {label}
        {icon === "right" ? <ChevronRight className="h-4 w-4" aria-hidden /> : null}
      </Button>
    </Link>
  );
}
