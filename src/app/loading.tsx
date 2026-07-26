import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-4">
      <div className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm font-medium text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
        Loading...
      </div>
    </main>
  );
}
