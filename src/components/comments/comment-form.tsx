"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { createCommentAction, updateCommentAction, type CommentActionState } from "@/lib/actions/comments";
import type { LessonComment } from "@/types/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommentFormProps = {
  lessonId?: string;
  parentCommentId?: string;
  commentId?: string;
  initialContent?: string;
  mode?: "create" | "edit";
  onDone?: () => void;
  onSaved?: (comment: LessonComment) => void;
};

const initialState: CommentActionState = { ok: false, message: "" };

export function CommentForm({ lessonId, parentCommentId, commentId, initialContent = "", mode = "create", onDone, onSaved }: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [state, setState] = useState(initialState);
  const [pending, setPending] = useState(false);
  const remaining = 4000 - content.length;

  async function submit() {
    setPending(true);
    setState(initialState);
    const formData = new FormData();
    formData.set("content", content);

    if (mode === "edit" && commentId) {
      formData.set("commentId", commentId);
      try {
        const result = await updateCommentAction(initialState, formData);
        setState(result);
        if (result.ok && result.comment) {
          onSaved?.(result.comment);
          onDone?.();
        }
      } finally {
        setPending(false);
      }
      return;
    }

    if (lessonId) {
      formData.set("lessonId", lessonId);
    }
    if (parentCommentId) {
      formData.set("parentCommentId", parentCommentId);
    }

    try {
      const result = await createCommentAction(initialState, formData);
      setState(result);
      if (result.ok && result.comment) {
        onSaved?.(result.comment);
        setContent("");
        onDone?.();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={4000}
        rows={mode === "edit" ? 4 : 5}
        placeholder={parentCommentId ? "Write a reply" : "Ask a question or share something helpful"}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={remaining < 0 ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {remaining} characters left
        </span>
        <div className="flex gap-2">
          {onDone ? (
            <Button type="button" variant="ghost" onClick={onDone}>
              Cancel
            </Button>
          ) : null}
          <Button type="button" disabled={pending || content.trim().length < 2 || remaining < 0} onClick={submit}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            {pending ? "Saving..." : mode === "edit" ? "Save" : parentCommentId ? "Reply" : "Post comment"}
          </Button>
        </div>
      </div>
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-destructive"} role="status">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
