import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  createLessonAction,
  createModuleAction,
  deleteLessonAction,
  deleteModuleAction,
  moveLessonAction,
  moveModuleAction,
  updateLessonAction,
  updateModuleAction
} from "@/lib/actions/courses";
import { ActionButton } from "@/components/ui/action-button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LessonMediaUpload } from "@/components/courses/lesson-media-upload";

export type CourseModuleWithLessons = {
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
  }[];
};

type ModuleManagerProps = {
  courseId: string;
  modules: CourseModuleWithLessons[];
};

export function ModuleManager({ courseId, modules }: ModuleManagerProps) {
  return (
    <div className="space-y-5">
      <form action={createModuleAction} className="rounded-md border border-border bg-background p-4">
        <input type="hidden" name="courseId" value={courseId} />
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="new-module-title">New module</Label>
            <Input id="new-module-title" name="title" placeholder="Module title" required minLength={3} />
          </div>
          <PendingSubmitButton pendingLabel="Adding...">
            <Plus className="h-4 w-4" aria-hidden />
            Add module
          </PendingSubmitButton>
        </div>
      </form>

      {modules.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
          Add your first module before creating lessons.
        </div>
      ) : null}

      {modules.map((module) => (
        <section key={module.id} className="rounded-md border border-border bg-background p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <form action={updateModuleAction} className="grid flex-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <input type="hidden" name="moduleId" value={module.id} />
              <div className="space-y-2">
                <Label htmlFor={`module-${module.id}`}>Module {module.position}</Label>
                <Input id={`module-${module.id}`} name="title" defaultValue={module.title} required minLength={3} />
              </div>
              <PendingSubmitButton variant="secondary" pendingLabel="Renaming...">Rename</PendingSubmitButton>
            </form>
            <div className="flex gap-2">
              <ReorderButton idName="moduleId" id={module.id} direction="up" action={moveModuleAction} />
              <ReorderButton idName="moduleId" id={module.id} direction="down" action={moveModuleAction} />
              <ActionButton
                action={deleteModuleAction}
                fields={{ moduleId: module.id }}
                variant="danger"
                pendingLabel="Deleting..."
                aria-label={`Delete ${module.title}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </ActionButton>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {module.lessons.map((lesson) => (
              <details key={lesson.id} className="rounded-md border border-border p-4">
                <summary className="cursor-pointer font-semibold">
                  {lesson.position}. {lesson.title}
                </summary>
                <form action={updateLessonAction} className="mt-4 grid gap-3" id={`lesson-form-${lesson.id}`}>
                  <input type="hidden" name="lessonId" value={lesson.id} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`lesson-title-${lesson.id}`}>Lesson title</Label>
                      <Input id={`lesson-title-${lesson.id}`} name="title" defaultValue={lesson.title} required minLength={3} />
                    </div>
                    <LessonMediaUpload
                      label="Video"
                      inputName="videoUrl"
                      bucket="lesson-videos"
                      defaultValue={lesson.video_url}
                      accept="video/mp4,video/webm,video/quicktime"
                      maxSizeMb={500}
                      icon="video"
                    />
                  </div>
                  <LessonMediaUpload
                    label="Document"
                    inputName="documentUrl"
                    bucket="lesson-documents"
                    defaultValue={lesson.document_url}
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                    maxSizeMb={50}
                    icon="document"
                  />
                  <div className="space-y-2">
                    <Label htmlFor={`lesson-content-${lesson.id}`}>Content</Label>
                    <Textarea id={`lesson-content-${lesson.id}`} name="content" defaultValue={lesson.content} rows={8} required minLength={20} />
                  </div>
                  <PendingSubmitButton variant="secondary" className="w-fit" pendingLabel="Saving...">Save lesson</PendingSubmitButton>
                </form>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ReorderButton idName="lessonId" id={lesson.id} direction="up" action={moveLessonAction} />
                  <ReorderButton idName="lessonId" id={lesson.id} direction="down" action={moveLessonAction} />
                  <ActionButton
                    action={deleteLessonAction}
                    fields={{ lessonId: lesson.id }}
                    variant="danger"
                    pendingLabel="Deleting..."
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Delete lesson
                  </ActionButton>
                </div>
              </details>
            ))}

            <form action={createLessonAction} className="rounded-md border border-dashed border-border p-4">
              <input type="hidden" name="moduleId" value={module.id} />
              <div className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`new-lesson-title-${module.id}`}>New lesson title</Label>
                    <Input id={`new-lesson-title-${module.id}`} name="title" required minLength={3} />
                  </div>
                  <LessonMediaUpload
                    label="Video"
                    inputName="videoUrl"
                    bucket="lesson-videos"
                    accept="video/mp4,video/webm,video/quicktime"
                    maxSizeMb={500}
                    icon="video"
                  />
                </div>
                <LessonMediaUpload
                  label="Document"
                  inputName="documentUrl"
                  bucket="lesson-documents"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                  maxSizeMb={50}
                  icon="document"
                />
                <div className="space-y-2">
                  <Label htmlFor={`new-lesson-content-${module.id}`}>Lesson content</Label>
                  <Textarea id={`new-lesson-content-${module.id}`} name="content" rows={6} required minLength={20} />
                </div>
                <PendingSubmitButton className="w-fit" pendingLabel="Adding...">
                  <Plus className="h-4 w-4" aria-hidden />
                  Add lesson
                </PendingSubmitButton>
              </div>
            </form>
          </div>
        </section>
      ))}
    </div>
  );
}

function ReorderButton({
  idName,
  id,
  direction,
  action
}: {
  idName: "moduleId" | "lessonId";
  id: string;
  direction: "up" | "down";
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <ActionButton
      action={action}
      fields={{ [idName]: id, direction }}
      variant="ghost"
      pendingLabel="Moving..."
      aria-label={`Move ${direction}`}
    >
      {direction === "up" ? <ArrowUp className="h-4 w-4" aria-hidden /> : <ArrowDown className="h-4 w-4" aria-hidden />}
    </ActionButton>
  );
}
