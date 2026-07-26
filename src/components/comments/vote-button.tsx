"use client";

import { useOptimistic, useTransition } from "react";
import { ThumbsUp } from "lucide-react";
import { toggleCommentVoteAction } from "@/lib/actions/comments";
import { Button } from "@/components/ui/button";

type VoteButtonProps = {
  commentId: string;
  voteCount: number;
  hasVoted: boolean;
  onVoteChanged?: (commentId: string, hasVoted: boolean) => void;
};

export function VoteButton({ commentId, voteCount, hasVoted, onVoteChanged }: VoteButtonProps) {
  const [pending, startTransition] = useTransition();
  const [optimistic, toggleOptimistic] = useOptimistic(
    { voteCount, hasVoted },
    (state) => ({
      voteCount: state.hasVoted ? Math.max(0, state.voteCount - 1) : state.voteCount + 1,
      hasVoted: !state.hasVoted
    })
  );

  function onVote() {
    const formData = new FormData();
    formData.set("commentId", commentId);
    startTransition(async () => {
      toggleOptimistic(undefined);
      await toggleCommentVoteAction(formData);
      onVoteChanged?.(commentId, !optimistic.hasVoted);
    });
  }

  return (
    <Button type="button" variant={optimistic.hasVoted ? "secondary" : "ghost"} disabled={pending} onClick={onVote}>
      <ThumbsUp className="h-4 w-4" aria-hidden />
      {optimistic.voteCount}
    </Button>
  );
}
