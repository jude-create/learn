import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressButton } from "@/components/lessons/progress-button";
import { CourseProgress } from "@/components/courses/course-progress";
import { CommentSection } from "@/components/comments/comment-section";
import type { LessonComment } from "@/types/comments";

type LearnPageProps = {
  params: Promise<{
    courseSlug: string;
    lessonSlug: string;
  }>;
};

type LearnCourse = {
  id: string;
  title: string;
  slug: string;
  instructor_id: string;
  status: string;
  course_modules: {
    id: string;
    title: string;
    position: number;
    lessons: {
      id: string;
      title: string;
      slug: string;
      content: string;
      video_url: string | null;
      document_url: string | null;
      position: number;
    }[] | null;
  }[] | null;
};

type ProgressRow = {
  lesson_id: string;
  is_completed: boolean;
};

export default async function LessonReaderPage({ params }: LearnPageProps) {
  const { courseSlug, lessonSlug } = await params;
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("courses")
    .select("id,title,slug,instructor_id,status,course_modules(id,title,position,lessons(id,title,slug,content,video_url,document_url,position))")
    .eq("slug", courseSlug)
    .single();
  const course = data as unknown as LearnCourse | null;

  if (!course) {
    notFound();
  }

  const isOwner = profile.role === "instructor" && profile.id === course.instructor_id;
  const isAdmin = profile.role === "admin";
  const { data: enrolment } = profile.role === "student"
    ? await supabase
        .from("enrolments")
        .select("id")
        .eq("course_id", course.id)
        .eq("student_id", profile.id)
        .maybeSingle()
    : { data: null };

  if (!isOwner && !isAdmin && !enrolment) {
    redirect(`/courses/${course.slug}`);
  }

  const modules = [...(course.course_modules ?? [])]
    .map((module) => ({
      ...module,
      lessons: [...(module.lessons ?? [])].sort((a, b) => a.position - b.position)
    }))
    .sort((a, b) => a.position - b.position);
  const lessons = modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id })));
  const currentIndex = lessons.findIndex((lesson) => lesson.slug === lessonSlug);
  const currentLesson = lessons[currentIndex];

  if (!currentLesson) {
    notFound();
  }

  const { data: progressData } = profile.role === "student"
    ? await supabase.from("lesson_progress").select("lesson_id,is_completed").eq("student_id", profile.id)
    : { data: [] };
  const progress = (progressData as ProgressRow[] | null) ?? [];
  const completedLessonIds = new Set(progress.filter((item) => item.is_completed).map((item) => item.lesson_id));
  const previousLesson = lessons[currentIndex - 1];
  const nextLesson = lessons[currentIndex + 1];
  const embedUrl = getEmbeddableVideoUrl(currentLesson.video_url);
  const { data: commentData } = await supabase
    .from("comments")
    .select("id,lesson_id,user_id,parent_comment_id,content,is_pinned,is_accepted_answer,created_at,updated_at,profiles(id,full_name,role,avatar_url),comment_votes(user_id)")
    .eq("lesson_id", currentLesson.id)
    .order("created_at", { ascending: false });
  const comments = buildCommentTree((commentData as unknown as LessonComment[] | null) ?? []);

  return (
    <div className="min-h-screen bg-muted lg:grid lg:grid-cols-[320px_1fr]">
      <aside className="border-b border-border bg-background lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="sticky top-0 p-4">
          <Link href={`/courses/${course.slug}`} className="text-sm font-semibold text-primary hover:underline">
            Back to course
          </Link>
          <h1 className="mt-3 text-xl font-bold">{course.title}</h1>
          <div className="mt-5">
            <CourseProgress completed={completedLessonIds.size} total={lessons.length} />
          </div>
          <nav className="mt-6 space-y-4">
            {modules.map((module) => (
              <div key={module.id}>
                <p className="text-sm font-semibold">{module.title}</p>
                <div className="mt-2 space-y-1">
                  {module.lessons.map((lesson) => {
                    const active = lesson.id === currentLesson.id;
                    const done = completedLessonIds.has(lesson.id);
                    return (
                      <Link
                        key={lesson.id}
                        href={`/learn/${course.slug}/${lesson.slug}`}
                        className={active ? "flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-semibold" : "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"}
                      >
                        {done ? <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden /> : <span className="h-4 w-4 rounded-full border border-border" />}
                        {lesson.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <main className="px-4 py-8 md:px-8">
        <article className="mx-auto max-w-3xl rounded-md border border-border bg-background p-5 md:p-8">
          <Badge>Lesson {currentIndex + 1}</Badge>
          <h2 className="mt-4 text-3xl font-bold">{currentLesson.title}</h2>
          {embedUrl ? (
            <div className="mt-6 aspect-video overflow-hidden rounded-md border border-border bg-muted">
              <iframe
                src={embedUrl}
                title={currentLesson.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : currentLesson.video_url ? (
            <video className="mt-6 aspect-video w-full rounded-md border border-border bg-black" src={currentLesson.video_url} controls />
          ) : null}
          {currentLesson.document_url ? (
            <a
              href={currentLesson.document_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
            >
              <FileText className="h-4 w-4 text-primary" aria-hidden />
              Open lesson document
            </a>
          ) : null}
          <div className="mt-8 max-w-none whitespace-pre-wrap leading-8 text-foreground">
            {currentLesson.content}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <div className="flex flex-wrap gap-2">
              {previousLesson ? (
                <Link href={`/learn/${course.slug}/${previousLesson.slug}`}>
                  <Button variant="secondary">
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Previous
                  </Button>
                </Link>
              ) : null}
              {nextLesson ? (
                <Link href={`/learn/${course.slug}/${nextLesson.slug}`}>
                  <Button variant="secondary">
                    Next
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Link>
              ) : null}
            </div>
            {profile.role === "student" ? (
              <ProgressButton
                lessonId={currentLesson.id}
                courseSlug={course.slug}
                lessonSlug={currentLesson.slug}
                isCompleted={completedLessonIds.has(currentLesson.id)}
              />
            ) : null}
          </div>
        </article>

        <CommentSection
          lessonId={currentLesson.id}
          comments={comments}
          currentUserId={profile.id}
          currentUserRole={profile.role}
          canModerate={isOwner}
        />
      </main>
    </div>
  );
}

function buildCommentTree(rows: LessonComment[]) {
  const byId = new Map<string, LessonComment>();
  const roots: LessonComment[] = [];

  rows.forEach((row) => {
    byId.set(row.id, { ...row, replies: [] });
  });

  byId.forEach((comment) => {
    if (comment.parent_comment_id) {
      byId.get(comment.parent_comment_id)?.replies.push(comment);
    } else {
      roots.push(comment);
    }
  });

  byId.forEach((comment) => {
    comment.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  });

  return roots.sort((a, b) => {
    if (a.is_accepted_answer !== b.is_accepted_answer) return a.is_accepted_answer ? -1 : 1;
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    const voteDifference = (b.comment_votes?.length ?? 0) - (a.comment_votes?.length ?? 0);
    if (voteDifference !== 0) return voteDifference;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function getEmbeddableVideoUrl(videoUrl: string | null) {
  if (!videoUrl) {
    return null;
  }

  try {
    const url = new URL(videoUrl);
    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (url.hostname.includes("vimeo.com")) {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}
