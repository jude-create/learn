import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function CoursesLoadingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <LoadingSkeleton className="h-10 w-64" />
      <LoadingSkeleton className="mt-3 h-5 w-96 max-w-full" />
      <LoadingSkeleton className="mt-8 h-20 w-full" />
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-72" />
        ))}
      </div>
    </main>
  );
}
