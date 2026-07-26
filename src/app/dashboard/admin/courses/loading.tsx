import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function AdminCoursesLoadingPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-background p-4">
        <LoadingSkeleton className="h-7 w-36" />
        <LoadingSkeleton className="mt-4 h-10 w-full" />
      </div>
      {Array.from({ length: 5 }).map((_, index) => (
        <LoadingSkeleton key={index} className="h-24 w-full" />
      ))}
    </div>
  );
}
