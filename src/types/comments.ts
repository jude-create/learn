import type { UserRole } from "@/types/database";

export type CommentAuthor = {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
};

export type LessonComment = {
  id: string;
  lesson_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_pinned: boolean;
  is_accepted_answer: boolean;
  created_at: string;
  updated_at: string;
  profiles: CommentAuthor | null;
  comment_votes: { user_id: string }[] | null;
  replies: LessonComment[];
};
