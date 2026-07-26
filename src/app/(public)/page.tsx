import Link from "next/link";
import { ArrowRight, BookOpen, Layers3, MessageSquareText, Sparkles, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const platformHighlights = [
  {
    title: "Structured courses",
    description: "Modules and lessons keep learning paths clear.",
    icon: BookOpen
  },
  {
    title: "Helpful discussions",
    description: "Replies, votes, pinned comments and accepted answers.",
    icon: MessageSquareText
  },
  {
    title: "Learning spaces",
    description: "Each course has the tools learners and educators need.",
    icon: Layers3
  }
];

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id,title,slug,description,category,level,thumbnail_url")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main>
      <section className="border-b border-border bg-[radial-gradient(circle_at_top_left,hsl(var(--accent))_0,transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eef7f5_48%,#fff7ed_100%)]">
        <div className="mx-auto grid min-h-[540px] max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <Badge>Courses with thoughtful discussions built in</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-normal text-foreground sm:text-6xl">
              Learn Big
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              A clean learning platform for coding, secondary school subjects and university courses, where students build understanding through focused, voteable discussions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses">
                <Button>
                  Browse courses
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary">Start teaching</Button>
              </Link>
            </div>
          </div>
          <div className="grid gap-4 rounded-lg border border-white/80 bg-white/85 p-4 shadow-soft backdrop-blur">
            {platformHighlights.map((item) => (
              <div key={item.title} className="flex gap-3 rounded-md border border-border bg-background/80 p-4">
                <item.icon className="mt-1 h-5 w-5 text-primary" aria-hidden />
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Featured courses</h2>
            <p className="mt-2 text-muted-foreground">Fresh lessons across coding, science, commercial, arts and university topics.</p>
          </div>
          <Link href="/courses" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {(courses ?? []).map((course) => (
            <Link key={course.id} href={`/courses/${course.slug}`} className="rounded-lg border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
              <Badge>{course.level}</Badge>
              <h3 className="mt-4 text-lg font-semibold">{course.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
              <p className="mt-4 text-sm font-medium text-primary">{course.category}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:grid-cols-2 lg:grid-cols-5">
          {["Coding", "Mathematics", "Science", "Commercial", "Arts"].map((category) => (
            <div key={category} className="rounded-lg border border-border bg-background p-5 shadow-sm">
              <Sparkles className="mb-4 h-5 w-5 text-primary" aria-hidden />
              <h3 className="font-semibold">{category}</h3>
              <p className="mt-2 text-sm text-muted-foreground">Find courses and discussions for school, personal study or higher education.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3">
        {[
          ["Enroll", "Students join published courses and continue from their dashboard."],
          ["Learn", "Lessons are organised by module with progress tracking."],
          ["Discuss", "Questions surface through replies, votes and accepted answers."]
        ].map(([title, description]) => (
          <div key={title} className="flex gap-3">
            <Users className="mt-1 h-5 w-5 text-primary" aria-hidden />
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </section>

    </main>
  );
}
