"use client";

import { useRef, useState } from "react";
import { FileUp, Video } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LessonMediaUploadProps = {
  label: string;
  inputName: "videoUrl" | "documentUrl";
  bucket: "lesson-videos" | "lesson-documents";
  defaultValue?: string | null;
  accept: string;
  maxSizeMb: number;
  icon: "video" | "document";
};

export function LessonMediaUpload({ label, inputName, bucket, defaultValue, accept, maxSizeMb, icon }: LessonMediaUploadProps) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = icon === "video" ? Video : FileUp;

  async function onFileChange(file: File | undefined) {
    if (!file) return;
    setMessage("");

    if (file.size > maxSizeMb * 1024 * 1024) {
      setMessage(`Choose a file under ${maxSizeMb} MB.`);
      return;
    }

    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Sign in again before uploading.");
      setUploading(false);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "file";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

    if (error) {
      setMessage(error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setUrl(data.publicUrl);
    setMessage("Upload ready. Save the lesson to keep it.");
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <Input name={inputName} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste a URL or upload a file" />
        <input ref={inputRef} className="sr-only" type="file" accept={accept} onChange={(event) => onFileChange(event.target.files?.[0])} />
        <Button type="button" variant="secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Icon className="h-4 w-4" aria-hidden />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
