import { CheckCircle2, Circle } from "lucide-react";
import { markLessonProgressAction } from "@/lib/actions/learning";
import { ActionButton } from "@/components/ui/action-button";

type ProgressButtonProps = {
  lessonId: string;
  courseSlug: string;
  lessonSlug: string;
  isCompleted: boolean;
};

export function ProgressButton({ lessonId, courseSlug, lessonSlug, isCompleted }: ProgressButtonProps) {
  return (
    <ActionButton
      action={markLessonProgressAction}
      fields={{
        lessonId,
        courseSlug,
        lessonSlug,
        isCompleted: String(!isCompleted)
      }}
      variant={isCompleted ? "secondary" : "primary"}
      pendingLabel="Saving..."
    >
      {isCompleted ? <Circle className="h-4 w-4" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
      {isCompleted ? "Mark incomplete" : "Mark complete"}
    </ActionButton>
  );
}
