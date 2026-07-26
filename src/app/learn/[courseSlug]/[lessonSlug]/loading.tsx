import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function LessonReaderLoadingPage() {
  return (
    <div className="min-h-screen bg-muted lg:grid lg:grid-cols-[320px_1fr]">
      <aside className="border-b border-border bg-background p-4 lg:min-h-screen lg:border-b-0 lg:border-r">
        <LoadingSkeleton className="h-5 w-28" />
        <LoadingSkeleton className="mt-4 h-7 w-56" />
        <LoadingSkeleton className="mt-6 h-3 w-full" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <LoadingSkeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </aside>
      <main className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-3xl rounded-md border border-border bg-background p-8">
          <LoadingSkeleton className="h-6 w-24" />
          <LoadingSkeleton className="mt-5 h-10 w-3/4" />
          <LoadingSkeleton className="mt-8 aspect-video w-full" />
          <LoadingSkeleton className="mt-8 h-32 w-full" />
        </div>
      </main>
    </div>
  );
}
