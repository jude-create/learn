"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MessageSquareReply, MoreHorizontal, Pin, Trash2 } from "lucide-react";
import {
  deleteCommentAction,
  setAcceptedAnswerAction,
  setCommentPinnedAction
} from "@/lib/actions/comments";
import type { LessonComment } from "@/types/comments";
import type { UserRole } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommentForm } from "@/components/comments/comment-form";
import { VoteButton } from "@/components/comments/vote-button";

type CommentItemProps = {
  comment: LessonComment;
  lessonId: string;
  currentUserId: string;
  currentUserRole: UserRole;
  canModerate: boolean;
  isReply?: boolean;
  onCommentCreated: (comment: LessonComment) => void;
  onCommentUpdated: (comment: LessonComment) => void;
  onCommentDeleted: (commentId: string) => void;
  onCommentPinned: (commentId: string, enabled: boolean) => void;
  onAcceptedAnswer: (commentId: string, enabled: boolean) => void;
  onVoteChanged: (commentId: string, hasVoted: boolean) => void;
};

export function CommentItem({
  comment,
  lessonId,
  currentUserId,
  currentUserRole,
  canModerate,
  isReply = false,
  onCommentCreated,
  onCommentUpdated,
  onCommentDeleted,
  onCommentPinned,
  onAcceptedAnswer,
  onVoteChanged
}: CommentItemProps) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const author = comment.profiles;
  const isOwner = comment.user_id === currentUserId;
  const canEdit = isOwner || currentUserRole === "admin";
  const canDelete = isOwner || currentUserRole === "admin";
  const votes = comment.comment_votes ?? [];
  const hasVoted = votes.some((vote) => vote.user_id === currentUserId);

  async function deleteComment() {
    setDeleting(true);
    const formData = new FormData();
    formData.set("commentId", comment.id);

    try {
      const result = await deleteCommentAction(formData);
      if (result.ok && result.commentId) {
        onCommentDeleted(result.commentId);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className={isReply ? "rounded-md border border-border bg-muted/40 p-4" : "rounded-md border border-border bg-background p-4"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{author?.full_name ?? "Unknown user"}</span>
            {author?.role === "instructor" ? <Badge>Instructor</Badge> : null}
            {comment.is_pinned ? <Badge className="text-primary">Pinned</Badge> : null}
            {comment.is_accepted_answer ? <Badge className="text-emerald-700">Accepted</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(comment.created_at)}</p>
        </div>
        <VoteButton commentId={comment.id} voteCount={votes.length} hasVoted={hasVoted} onVoteChanged={onVoteChanged} />
      </div>

      {editing ? (
        <div className="mt-4">
          <CommentForm
            mode="edit"
            commentId={comment.id}
            initialContent={comment.content}
            onDone={() => setEditing(false)}
            onSaved={onCommentUpdated}
          />
        </div>
      ) : (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{comment.content}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!isReply ? (
          <Button type="button" variant="ghost" onClick={() => setReplying((current) => !current)}>
            <MessageSquareReply className="h-4 w-4" aria-hidden />
            Reply
          </Button>
        ) : null}
        {canEdit ? (
          <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
            <MoreHorizontal className="h-4 w-4" aria-hidden />
            Edit
          </Button>
        ) : null}
        {canDelete ? (
          <Button type="button" variant="danger" disabled={deleting} onClick={deleteComment}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        ) : null}
        {canModerate ? (
          <>
            <ModerationButton
              commentId={comment.id}
              action={setCommentPinnedAction}
              enabled={!comment.is_pinned}
              label={comment.is_pinned ? "Unpin" : "Pin"}
              icon={<Pin className="h-4 w-4" aria-hidden />}
              onDone={onCommentPinned}
            />
            <ModerationButton
              commentId={comment.id}
              action={setAcceptedAnswerAction}
              enabled={!comment.is_accepted_answer}
              label={comment.is_accepted_answer ? "Remove accepted" : "Accept"}
              icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
              onDone={onAcceptedAnswer}
            />
          </>
        ) : null}
      </div>

      {replying ? (
        <div className="mt-4">
          <CommentForm
            lessonId={lessonId}
            parentCommentId={comment.id}
            onDone={() => setReplying(false)}
            onSaved={onCommentCreated}
          />
        </div>
      ) : null}

      {comment.replies.length > 0 ? (
        <div className="mt-4 space-y-3 border-l border-border pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              lessonId={lessonId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              canModerate={canModerate}
              onCommentCreated={onCommentCreated}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
              onCommentPinned={onCommentPinned}
              onAcceptedAnswer={onAcceptedAnswer}
              onVoteChanged={onVoteChanged}
              isReply
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function ModerationButton({
  commentId,
  action,
  enabled,
  label,
  icon,
  onDone
}: {
  commentId: string;
  action: (formData: FormData) => Promise<void>;
  enabled: boolean;
  label: string;
  icon: React.ReactNode;
  onDone: (commentId: string, enabled: boolean) => void;
}) {
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    const formData = new FormData();
    formData.set("commentId", commentId);
    formData.set("enabled", String(enabled));
    await action(formData);
    onDone(commentId, enabled);
    setPending(false);
  }

  return (
    <Button type="button" variant="secondary" disabled={pending} onClick={run}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {pending ? "Saving..." : label}
    </Button>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
