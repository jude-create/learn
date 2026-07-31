import Link from "next/link";
import { BookOpen, MessageSquareText, UploadCloud } from "lucide-react";
import { formatCourseCode, formatSemester } from "@/lib/academic";
import { Badge } from "@/components/ui/badge";

type CourseCardProps = {
  schoolSlug: string;
  course: {
    slug: string;
    courseCode: string;
    title: string;
    description: string;
    academicLevel: number | null;
    semester: string | null;
    _count?: {
      materials?: number;
      discussionThreads?: number;
    };
  };
};

export function CourseCard({ schoolSlug, course }: CourseCardProps) {
  return (
    <Link href={`/schools/${schoolSlug}/courses/${course.slug}`} className="rounded-md border border-border bg-background p-5 transition hover:shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-primary/10 text-primary">{formatCourseCode(course.courseCode)}</Badge>
        {course.academicLevel ? <Badge>{course.academicLevel} level</Badge> : null}
        {course.semester ? <Badge>{formatSemester(course.semester)}</Badge> : null}
      </div>
      <h2 className="mt-4 text-lg font-semibold">{course.title}</h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{course.description || "No course description yet."}</p>
      <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <UploadCloud className="h-4 w-4" aria-hidden />
          {course._count?.materials ?? 0} materials
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageSquareText className="h-4 w-4" aria-hidden />
          {course._count?.discussionThreads ?? 0} discussions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" aria-hidden />
          Course hub
        </span>
      </div>
    </Link>
  );
}
