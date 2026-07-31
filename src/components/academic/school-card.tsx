import Link from "next/link";
import { Building2, LibraryBig } from "lucide-react";

type SchoolCardProps = {
  name: string;
  slug: string;
  state: string | null;
  country: string;
  departmentCount: number;
  courseCount: number;
};

export function SchoolCard({ name, slug, state, country, departmentCount, courseCount }: SchoolCardProps) {
  return (
    <Link href={`/schools/${slug}`} className="rounded-md border border-border bg-background p-5 transition hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-accent text-primary">
          <Building2 className="h-5 w-5" aria-hidden />
        </span>
        <span className="text-xs font-medium text-muted-foreground">{state ? `${state}, ${country}` : country}</span>
      </div>
      <h2 className="mt-5 text-lg font-semibold">{name}</h2>
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <LibraryBig className="h-4 w-4" aria-hidden />
          {departmentCount} departments
        </span>
        <span>{courseCount} courses</span>
      </div>
    </Link>
  );
}
