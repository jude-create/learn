import { Trash2 } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminDeleteCommentAction } from "@/lib/actions/admin";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminActionButton } from "@/components/admin/admin-action-button";

type AdminComment = {
  id: string;
  content: string;
  created_at: string;
  profiles: { full_name: string } | null;
  lessons: {
    title: string;
    course_modules: {
      courses: { title: string } | null;
    } | null;
  } | null;
};

export default async function AdminCommentsPage() {
  await requireProfile("admin");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("comments")
    .select("id,content,created_at,profiles(full_name),lessons(title,course_modules(courses(title)))")
    .order("created_at", { ascending: false })
    .limit(50);
  const comments = data as unknown as AdminComment[] | null;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-background p-4">
        <h2 className="text-xl font-semibold">Recent comments</h2>
      </div>
      {(comments ?? []).length === 0 ? (
        <EmptyState title="No comments yet" description="Recent lesson discussion activity will appear here." />
      ) : null}
      {(comments ?? []).map((comment) => (
        <div key={comment.id} className="rounded-md border border-border bg-background p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm">{comment.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {comment.profiles?.full_name ?? "Unknown"} / {new Date(comment.created_at).toLocaleDateString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {comment.lessons?.course_modules?.courses?.title ?? "Unknown course"} / {comment.lessons?.title ?? "Unknown lesson"}
              </p>
            </div>
            <AdminActionButton action={adminDeleteCommentAction} hiddenFields={{ commentId: comment.id }} variant="danger">
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </AdminActionButton>
          </div>
        </div>
      ))}
    </div>
  );
}
