"use client";

import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import type { LessonComment } from "@/types/comments";
import type { UserRole } from "@/types/database";
import { EmptyState } from "@/components/ui/empty-state";
import { CommentForm } from "@/components/comments/comment-form";
import { CommentItem } from "@/components/comments/comment-item";

type CommentSectionProps = {
  lessonId: string;
  comments: LessonComment[];
  currentUserId: string;
  currentUserRole: UserRole;
  canModerate: boolean;
};

export function CommentSection({ lessonId, comments, currentUserId, currentUserRole, canModerate }: CommentSectionProps) {
  const [visibleComments, setVisibleComments] = useState(() => sortComments(comments));

  useEffect(() => {
    setVisibleComments(sortComments(comments));
  }, [comments, lessonId]);

  function handleCommentCreated(comment: LessonComment) {
    setVisibleComments((current) => {
      if (comment.parent_comment_id) {
        return sortComments(
          current.map((item) =>
            item.id === comment.parent_comment_id
              ? { ...item, replies: [...item.replies, comment].sort(sortByOldest) }
              : item
          )
        );
      }

      return sortComments([{ ...comment, replies: [] }, ...current]);
    });
  }

  function handleCommentUpdated(comment: LessonComment) {
    setVisibleComments((current) => sortComments(updateCommentInTree(current, comment)));
  }

  function handleCommentDeleted(commentId: string) {
    setVisibleComments((current) => deleteCommentFromTree(current, commentId));
  }

  function handleCommentPinned(commentId: string, enabled: boolean) {
    setVisibleComments((current) =>
      sortComments(
        current.map((comment) =>
          comment.id === commentId ? { ...comment, is_pinned: enabled } : comment
        )
      )
    );
  }

  function handleAcceptedAnswer(commentId: string, enabled: boolean) {
    setVisibleComments((current) =>
      sortComments(
        current.map((comment) => ({
          ...comment,
          is_accepted_answer: comment.id === commentId ? enabled : enabled ? false : comment.is_accepted_answer
        }))
      )
    );
  }

  function handleVoteChanged(commentId: string, hasVoted: boolean) {
    setVisibleComments((current) => sortComments(updateVotesInTree(current, commentId, currentUserId, hasVoted)));
  }

  return (
    <section className="mx-auto mt-6 max-w-3xl rounded-md border border-border bg-background p-5">
      <div className="flex items-center gap-2">
        <MessageSquareText className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="text-lg font-semibold">Discussion</h2>
      </div>
      <div className="mt-5">
        <CommentForm lessonId={lessonId} onSaved={handleCommentCreated} />
      </div>
      <div className="mt-6 space-y-4">
        {visibleComments.length === 0 ? (
          <EmptyState title="No comments yet" description="Start the discussion with a useful question or note." />
        ) : (
          visibleComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              lessonId={lessonId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              canModerate={canModerate}
              onCommentCreated={handleCommentCreated}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
              onCommentPinned={handleCommentPinned}
              onAcceptedAnswer={handleAcceptedAnswer}
              onVoteChanged={handleVoteChanged}
            />
          ))
        )}
      </div>
    </section>
  );
}

function updateVotesInTree(comments: LessonComment[], commentId: string, userId: string, hasVoted: boolean): LessonComment[] {
  return comments.map((comment) => {
    const updateVotes = (item: LessonComment): LessonComment => {
      const existingVotes = item.comment_votes ?? [];
      const nextVotes = hasVoted
        ? existingVotes.some((vote) => vote.user_id === userId)
          ? existingVotes
          : [...existingVotes, { user_id: userId }]
        : existingVotes.filter((vote) => vote.user_id !== userId);

      return { ...item, comment_votes: nextVotes };
    };

    if (comment.id === commentId) {
      return updateVotes(comment);
    }

    return {
      ...comment,
      replies: comment.replies.map((reply) => (reply.id === commentId ? updateVotes(reply) : reply))
    };
  });
}

function updateCommentInTree(comments: LessonComment[], updated: LessonComment): LessonComment[] {
  return comments.map((comment) => {
    if (comment.id === updated.id) {
      return { ...comment, ...updated, replies: comment.replies };
    }

    return {
      ...comment,
      replies: comment.replies.map((reply) => (reply.id === updated.id ? { ...reply, ...updated, replies: [] } : reply))
    };
  });
}

function deleteCommentFromTree(comments: LessonComment[], commentId: string): LessonComment[] {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies.filter((reply) => reply.id !== commentId)
    }));
}

function sortComments(comments: LessonComment[]) {
  return [...comments].sort((a, b) => {
    if (a.is_accepted_answer !== b.is_accepted_answer) return a.is_accepted_answer ? -1 : 1;
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    const voteDifference = (b.comment_votes?.length ?? 0) - (a.comment_votes?.length ?? 0);
    if (voteDifference !== 0) return voteDifference;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function sortByOldest(a: LessonComment, b: LessonComment) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}
