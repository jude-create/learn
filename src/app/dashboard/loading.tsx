import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm font-medium text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
        Loading workspace...
      </div>
    </div>
  );
}
