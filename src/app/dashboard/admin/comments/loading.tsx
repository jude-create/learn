import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function AdminCommentsLoadingPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-background p-4">
        <LoadingSkeleton className="h-7 w-44" />
      </div>
      {Array.from({ length: 5 }).map((_, index) => (
        <LoadingSkeleton key={index} className="h-28 w-full" />
      ))}
    </div>
  );
}
