type CourseProgressProps = {
  completed: number;
  total: number;
};

export function CourseProgress({ completed, total }: CourseProgressProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{percent}% complete</span>
        <span className="text-muted-foreground">
          {completed}/{total} lessons
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
