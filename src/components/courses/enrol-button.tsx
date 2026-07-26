import Link from "next/link";
import { BookOpen, PlayCircle } from "lucide-react";
import { enrolInCourseAction } from "@/lib/actions/learning";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";

type EnrolButtonProps = {
  courseId: string;
  courseSlug: string;
  isEnrolled: boolean;
  firstLessonSlug?: string;
};

export function EnrolButton({ courseId, courseSlug, isEnrolled, firstLessonSlug }: EnrolButtonProps) {
  if (isEnrolled && firstLessonSlug) {
    return (
      <Link href={`/learn/${courseSlug}/${firstLessonSlug}`}>
        <Button className="w-full">
          <PlayCircle className="h-4 w-4" aria-hidden />
          Continue learning
        </Button>
      </Link>
    );
  }

  return (
    <ActionButton
      action={enrolInCourseAction}
      fields={{ courseId, courseSlug }}
      className="w-full"
      pendingLabel="Enrolling..."
    >
      <BookOpen className="h-4 w-4" aria-hidden />
      Enrol now
    </ActionButton>
  );
}
