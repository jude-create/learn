"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { suggestCourseAction } from "@/lib/actions/academic";
import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type DepartmentOption = {
  id: string;
  schoolId: string;
  name: string;
};

const initialState = { ok: false, message: "" };

export function CourseSuggestionForm({
  schoolId,
  departments
}: {
  schoolId: string;
  departments: DepartmentOption[];
}) {
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const defaultDepartment = useMemo(() => departments[0]?.id ?? "", [departments]);

  return (
    <form
      className="rounded-md border border-border bg-background p-5"
      action={(formData) => {
        startTransition(async () => {
          const result = await suggestCourseAction(initialState, formData);
          setState(result);
        });
      }}
    >
      <input type="hidden" name="schoolId" value={schoolId} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Suggest a missing course</h2>
          <p className="mt-1 text-sm text-muted-foreground">Course suggestions go to Admin review before appearing publicly.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="departmentId">Department</Label>
          <Select id="departmentId" name="departmentId" defaultValue={defaultDepartment} required>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="courseCode">Course code</Label>
          <Input id="courseCode" name="courseCode" placeholder="CSC 301" required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="courseTitle">Course title</Label>
          <Input id="courseTitle" name="courseTitle" placeholder="Data Structures and Algorithms" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="academicLevel">Academic level</Label>
          <Input id="academicLevel" name="academicLevel" inputMode="numeric" placeholder="300" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="semester">Semester</Label>
          <Select id="semester" name="semester" defaultValue="">
            <option value="">Unknown</option>
            <option value="first">First</option>
            <option value="second">Second</option>
            <option value="summer">Summer</option>
            <option value="full-year">Full year</option>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AuthFormMessage message={state.message} ok={state.ok} />
        <Button disabled={pending || departments.length === 0}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          Submit
        </Button>
      </div>
    </form>
  );
}
