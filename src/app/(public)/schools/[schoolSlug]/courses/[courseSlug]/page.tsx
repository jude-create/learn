import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Download, MessageSquareText, ShieldCheck, UploadCloud } from "lucide-react";
import { formatCourseCode, formatSemester } from "@/lib/academic";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type CourseHubPageProps = {
  params: Promise<{ schoolSlug: string; courseSlug: string }>;
};

export default async function CourseHubPage({ params }: CourseHubPageProps) {
  const { schoolSlug, courseSlug } = await params;
  const course = await prisma.academicCourse.findFirst({
    where: {
      slug: courseSlug,
      status: "active",
      school: {
        slug: schoolSlug,
        isVerified: true
      }
    },
    include: {
      school: true,
      department: true,
      moderators: {
        where: { isActive: true, removedAt: null },
        include: { user: true },
        take: 2
      },
      _count: {
        select: {
          materials: true,
          discussionThreads: true
        }
      }
    }
  });

  if (!course) {
    notFound();
  }

  const [latestMaterials, popularMaterials, recentDiscussions] = await Promise.all([
    prisma.material.findMany({
      where: { courseId: course.id, status: "approved" },
      orderBy: { createdAt: "desc" },
      include: { uploader: true, _count: { select: { votes: true, comments: true } } },
      take: 5
    }),
    prisma.material.findMany({
      where: { courseId: course.id, status: "approved" },
      orderBy: [{ downloadCount: "desc" }, { createdAt: "desc" }],
      include: { uploader: true, _count: { select: { votes: true } } },
      take: 5
    }),
    prisma.discussionThread.findMany({
      where: { courseId: course.id },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        author: true,
        _count: { select: { answers: true } }
      },
      take: 5
    })
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href={`/schools/${course.school.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {course.school.name}
      </Link>

      <section className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary">{formatCourseCode(course.courseCode)}</Badge>
            <Badge>{course.department.name}</Badge>
            {course.academicLevel ? <Badge>{course.academicLevel} level</Badge> : null}
            {course.semester ? <Badge>{formatSemester(course.semester)}</Badge> : null}
          </div>
          <h1 className="mt-5 text-3xl font-bold md:text-4xl">{course.title}</h1>
          <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{course.description || "This course hub is ready for student materials and discussions."}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/upload?course=${course.id}`}>
              <Button>
                <UploadCloud className="h-4 w-4" aria-hidden />
                Upload material
              </Button>
            </Link>
            <Link href={`/courses/${course.id}/discussions`}>
              <Button variant="secondary">
                <MessageSquareText className="h-4 w-4" aria-hidden />
                Discussions
              </Button>
            </Link>
          </div>
        </div>

        <aside className="rounded-md border border-border bg-muted/40 p-5">
          <h2 className="font-semibold">Course activity</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="Materials" value={course._count.materials} />
            <Metric label="Discussions" value={course._count.discussionThreads} />
          </div>
          <div className="mt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
              Moderators
            </h3>
            <div className="mt-3 grid gap-2">
              {course.moderators.length === 0 ? (
                <p className="text-sm text-muted-foreground">No moderators assigned yet.</p>
              ) : (
                course.moderators.map((moderator) => (
                  <div key={moderator.id} className="rounded-md bg-background px-3 py-2 text-sm">
                    {moderator.user.fullName}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <Panel title="Latest uploads">
          {latestMaterials.length === 0 ? (
            <EmptyState title="No approved materials yet" description="Be the first to upload useful notes, slides or past questions." />
          ) : (
            latestMaterials.map((material) => <MaterialRow key={material.id} material={material} />)
          )}
        </Panel>
        <Panel title="Popular materials">
          {popularMaterials.length === 0 ? (
            <EmptyState title="Nothing popular yet" description="Approved materials will appear here as students download and vote." />
          ) : (
            popularMaterials.map((material) => <MaterialRow key={material.id} material={material} />)
          )}
        </Panel>
      </section>

      <section className="mt-8">
        <Panel title="Recent discussions">
          {recentDiscussions.length === 0 ? (
            <EmptyState title="No discussions yet" description="Start a course question when you need help or want to compare approaches." />
          ) : (
            recentDiscussions.map((thread) => (
              <Link key={thread.id} href={`/discussions/${thread.id}`} className="block rounded-md border border-border p-4 transition hover:bg-muted">
                <div className="flex flex-wrap items-center gap-2">
                  {thread.isPinned ? <Badge className="bg-primary/10 text-primary">Pinned</Badge> : null}
                  {thread.acceptedAnswerId ? <Badge>Answered</Badge> : null}
                </div>
                <h3 className="mt-3 font-semibold">{thread.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{thread.body}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {thread._count.answers} answers by {thread.author.fullName}
                </p>
              </Link>
            ))
          )}
        </Panel>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  );
}

function MaterialRow({
  material
}: {
  material: {
    id: string;
    title: string;
    materialType: string;
    academicSession: string | null;
    downloadCount: number;
    uploader: { fullName: string };
    _count: { votes: number };
  };
}) {
  return (
    <Link href={`/materials/${material.id}`} className="block rounded-md border border-border p-4 transition hover:bg-muted">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{material.materialType.replace("_", " ")}</Badge>
        {material.academicSession ? <Badge>{material.academicSession}</Badge> : null}
      </div>
      <h3 className="mt-3 font-semibold">{material.title}</h3>
      <p className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>Uploaded by {material.uploader.fullName}</span>
        <span className="inline-flex items-center gap-1.5">
          <Download className="h-4 w-4" aria-hidden />
          {material.downloadCount}
        </span>
        <span>{material._count.votes} votes</span>
      </p>
    </Link>
  );
}
