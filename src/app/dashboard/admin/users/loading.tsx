import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function AdminUsersLoadingPage() {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <LoadingSkeleton className="h-7 w-32" />
      <LoadingSkeleton className="mt-4 h-10 w-full" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
