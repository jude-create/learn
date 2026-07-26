import { Eye, EyeOff, Trash2 } from "lucide-react";
import { deleteDraftCourseAction, setCourseStatusAction } from "@/lib/actions/courses";
import type { CourseStatus } from "@/types/database";
import { ActionButton } from "@/components/ui/action-button";

type CourseStatusActionsProps = {
  courseId: string;
  status: CourseStatus;
};

export function CourseStatusActions({ courseId, status }: CourseStatusActionsProps) {
  const nextStatus = status === "published" ? "unpublished" : "published";

  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton
        action={setCourseStatusAction}
        fields={{ courseId, status: nextStatus }}
        variant={status === "published" ? "secondary" : "primary"}
        pendingLabel={status === "published" ? "Unpublishing..." : "Publishing..."}
      >
        {status === "published" ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        {status === "published" ? "Unpublish" : "Publish"}
      </ActionButton>
      {status === "draft" ? (
        <ActionButton action={deleteDraftCourseAction} fields={{ courseId }} variant="danger" pendingLabel="Deleting...">
          <Trash2 className="h-4 w-4" aria-hidden />
          Delete draft
        </ActionButton>
      ) : null}
    </div>
  );
}
