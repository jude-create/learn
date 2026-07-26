"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { ImageUp, Loader2, Save } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { courseFormSchema, type CourseFormInput } from "@/lib/validations/courses";
import type { CourseActionState } from "@/lib/actions/courses";
import type { CourseLevel } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CourseFormProps = {
  courseId?: string;
  defaultValues?: {
    title: string;
    description: string;
    category: string;
    level: CourseLevel;
    thumbnailUrl: string;
  };
  action: (state: CourseActionState, formData: FormData) => Promise<CourseActionState>;
  submitLabel: string;
};

const initialState: CourseActionState = { ok: false, message: "" };

export function CourseForm({ courseId, defaultValues, action, submitLabel }: CourseFormProps) {
  const [state, setState] = useState(initialState);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<CourseFormInput>({
    defaultValues: defaultValues ?? {
      title: "",
      description: "",
      category: "",
      level: "beginner",
      thumbnailUrl: ""
    }
  });

  async function onSubmit(values: CourseFormInput) {
    const parsed = courseFormSchema.safeParse(values);
    if (!parsed.success) {
      const issue = parsed.error.errors[0];
      if (issue?.path[0]) {
        form.setError(issue.path[0] as keyof CourseFormInput, { message: issue.message });
      } else {
        setState({ ok: false, message: issue?.message ?? "Check the course details." });
      }
      return;
    }

    setUploading(true);
    const uploadedThumbnailUrl = thumbnailFile ? await uploadThumbnail(thumbnailFile, courseId) : null;
    setUploading(false);

    if (thumbnailFile && !uploadedThumbnailUrl) {
      setState({ ok: false, message: "Could not upload thumbnail. Use JPG, PNG or WebP under 3 MB." });
      return;
    }

    const formData = new FormData();
    if (courseId) {
      formData.set("courseId", courseId);
    }
    formData.set("title", parsed.data.title);
    formData.set("description", parsed.data.description);
    formData.set("category", parsed.data.category);
    formData.set("level", parsed.data.level);
    formData.set("thumbnailUrl", uploadedThumbnailUrl ?? parsed.data.thumbnailUrl ?? "");

    startTransition(async () => {
      const result = await action(initialState, formData);
      setState(result);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...form.register("title")} />
          <FieldError message={form.formState.errors.title?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" placeholder="React" {...form.register("category")} />
          <FieldError message={form.formState.errors.category?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">Level</Label>
          <Select id="level" {...form.register("level")}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
          <FieldError message={form.formState.errors.level?.message} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
          <Input id="thumbnailUrl" placeholder="https://..." {...form.register("thumbnailUrl")} />
          <FieldError message={form.formState.errors.thumbnailUrl?.message} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="thumbnailFile">Upload thumbnail</Label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground transition hover:bg-muted">
            <span className="inline-flex items-center gap-2">
              <ImageUp className="h-4 w-4" aria-hidden />
              {thumbnailFile ? thumbnailFile.name : "Choose JPG, PNG or WebP"}
            </span>
            <input
              id="thumbnailFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={6} {...form.register("description")} />
          <FieldError message={form.formState.errors.description?.message} />
        </div>
      </div>

      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-destructive"} role="status">
          {state.message}
        </p>
      ) : null}

      <Button disabled={pending || uploading}>
        {pending || uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
        {uploading ? "Uploading..." : pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

async function uploadThumbnail(file: File, courseId?: string) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type) || file.size > 3 * 1024 * 1024) {
    return null;
  }

  const supabase = createSupabaseBrowserClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "webp";
  const safeCourseSegment = courseId ?? "drafts";
  const path = `${user.id}/${safeCourseSegment}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("course-thumbnails").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type
  });

  if (error) {
    return null;
  }

  const { data } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
  return data.publicUrl;
}
