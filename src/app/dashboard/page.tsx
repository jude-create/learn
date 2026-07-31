import Link from "next/link";
import { BookOpen, Download, FileText, MessageSquareText, UploadCloud, Users } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { getDownloadAllowance } from "@/server/services/downloads/allowance";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const { profile } = await requireProfile();
  const [allowance, pendingUploads, approvedUploads, reputation, recentDownloads, recentDiscussions, suggestedCourses] = await Promise.all([
    getDownloadAllowance(profile.id),
    prisma.material.count({ where: { uploaderId: profile.id, status: "pending" } }),
    prisma.material.count({ where: { uploaderId: profile.id, status: "approved" } }),
    prisma.reputationEvent.aggregate({ where: { userId: profile.id }, _sum: { points: true } }),
    prisma.downloadEvent.findMany({
      where: { userId: profile.id },
      include: { material: { include: { course: true } } },
      orderBy: { downloadedAt: "desc" },
      take: 5
    }),
    prisma.discussionThread.findMany({
      where: { authorId: profile.id },
      include: { course: true, _count: { select: { answers: true } } },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.academicCourse.findMany({
      where: profile.school_id ? { schoolId: profile.school_id, status: "active" } : { status: "active" },
      orderBy: { updatedAt: "desc" },
      take: 4
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/schools">
            <Button variant="secondary">
              <BookOpen className="h-4 w-4" aria-hidden />
              Browse schools
            </Button>
          </Link>
          <Link href="/upload">
            <Button>
              <UploadCloud className="h-4 w-4" aria-hidden />
              Upload material
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={<Download className="h-5 w-5" />} label="Downloads remaining" value={allowance.downloadsRemaining} />
        <Stat icon={<UploadCloud className="h-5 w-5" />} label="Pending uploads" value={pendingUploads} />
        <Stat icon={<FileText className="h-5 w-5" />} label="Approved uploads" value={approvedUploads} />
        <Stat icon={<Users className="h-5 w-5" />} label="Reputation" value={reputation._sum.points ?? 0} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Panel title="Monthly allowance">
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Base" value={allowance.baseDownloads} />
            <MiniStat label="Upload bonus" value={allowance.uploadBonus} />
            <MiniStat label="Used" value={allowance.downloadsUsed} />
          </div>
        </Panel>

        <Panel title="Suggested courses">
          {suggestedCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Courses from your school will appear here.</p>
          ) : (
            suggestedCourses.map((course) => (
              <Link key={course.id} href={`/search?q=${encodeURIComponent(course.courseCode)}`} className="rounded-md border border-border p-3 text-sm hover:bg-muted">
                <span className="font-medium">{course.courseCode}</span>
                <span className="ml-2 text-muted-foreground">{course.title}</span>
              </Link>
            ))
          )}
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent downloads">
          {recentDownloads.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your downloads will appear here.</p>
          ) : (
            recentDownloads.map((event) => (
              <Link key={event.id} href={`/materials/${event.materialId}`} className="rounded-md border border-border p-3 text-sm hover:bg-muted">
                <span className="font-medium">{event.material.title}</span>
                <span className="ml-2 text-muted-foreground">{event.material.course.courseCode}</span>
              </Link>
            ))
          )}
        </Panel>

        <Panel title="Recent discussions">
          {recentDiscussions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Questions you ask will appear here.</p>
          ) : (
            recentDiscussions.map((thread) => (
              <Link key={thread.id} href={`/discussions/${thread.id}`} className="rounded-md border border-border p-3 text-sm hover:bg-muted">
                <span className="font-medium">{thread.title}</span>
                <span className="ml-2 text-muted-foreground">{thread._count.answers} answers</span>
              </Link>
            ))
          )}
        </Panel>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background p-5">
      <div className="text-primary">{icon}</div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/50 p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <MessageSquareText className="h-5 w-5 text-primary" aria-hidden />
        {title}
      </h2>
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  );
}
