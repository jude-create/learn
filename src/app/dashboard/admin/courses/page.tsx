import Link from "next/link";
import { EyeOff, ExternalLink } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminUnpublishCourseAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminActionButton } from "@/components/admin/admin-action-button";

type AdminCoursesPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

type AdminCourse = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "unpublished";
  category: string;
  level: string;
  created_at: string;
  profiles: { full_name: string } | null;
};

export default async function AdminCoursesPage({ searchParams }: AdminCoursesPageProps) {
  await requireProfile("admin");
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("courses")
    .select("id,title,slug,status,category,level,created_at,profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,category.ilike.%${params.q}%`);
  }

  if (params.status && ["draft", "published", "unpublished"].includes(params.status)) {
    query = query.eq("status", params.status);
  }

  const { data } = await query;
  const courses = (data as unknown as AdminCourse[] | null) ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-background p-4">
        <h2 className="text-xl font-semibold">Courses</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input className="h-10 rounded-md border border-border px-3 text-sm" name="q" defaultValue={params.q ?? ""} placeholder="Search courses" />
          <select className="h-10 rounded-md border border-border px-3 text-sm" name="status" defaultValue={params.status ?? ""}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
          <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Filter</button>
        </form>
      </div>
      {courses.length === 0 ? (
        <EmptyState title="No courses found" description="Try a different search or status filter." />
      ) : null}
      {courses.map((course) => (
        <div key={course.id} className="rounded-md border border-border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{course.title}</h2>
              <p className="text-sm text-muted-foreground">
                {course.category} / {course.level} / Instructor: {course.profiles?.full_name ?? "Unknown"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{course.status}</Badge>
              {course.status === "published" ? (
                <>
                  <Link href={`/courses/${course.slug}`} className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold hover:bg-muted">
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    View
                  </Link>
                  <AdminActionButton action={adminUnpublishCourseAction} hiddenFields={{ courseId: course.id }} variant="danger">
                    <EyeOff className="h-4 w-4" aria-hidden />
                    Unpublish
                  </AdminActionButton>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
