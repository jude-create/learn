"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { completeOnboardingAction, suggestSchoolAction } from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AuthFormMessage } from "@/components/auth/auth-form-message";

type SchoolOption = {
  id: string;
  name: string;
};

type DepartmentOption = {
  id: string;
  school_id: string;
  name: string;
};

const initialState = { ok: false, message: "" };

export function OnboardingForm({ schools, departments }: { schools: SchoolOption[]; departments: DepartmentOption[] }) {
  const [schoolId, setSchoolId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [state, setState] = useState(initialState);
  const [suggestionState, setSuggestionState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const availableDepartments = useMemo(
    () => departments.filter((department) => department.school_id === schoolId),
    [departments, schoolId]
  );

  return (
    <div className="space-y-8">
      <form
        className="space-y-4"
        action={(formData) => {
          startTransition(async () => {
            const result = await completeOnboardingAction(initialState, formData);
            setState(result);
            if (result.ok) {
              window.location.assign("/dashboard");
            }
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="schoolId">School</Label>
          <Select
            id="schoolId"
            name="schoolId"
            value={schoolId}
            onChange={(event) => {
              setSchoolId(event.target.value);
              setDepartmentId("");
            }}
            required
          >
            <option value="">Select school</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="departmentId">Department or subject</Label>
          <Select
            id="departmentId"
            name="departmentId"
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            disabled={!schoolId}
            required
          >
            <option value="">{schoolId ? "Select department" : "Select a school first"}</option>
            {availableDepartments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" placeholder="e.g. ada_codes" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="programme">Programme</Label>
            <Input id="programme" name="programme" placeholder="BSc Computer Science" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="graduationYear">Graduation year</Label>
            <Input id="graduationYear" name="graduationYear" inputMode="numeric" placeholder="2028" />
          </div>
        </div>
        <AuthFormMessage message={state.message} ok={state.ok} />
        <Button className="w-full" disabled={pending || schools.length === 0}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Complete onboarding
        </Button>
      </form>

      <form
        className="rounded-md border border-border bg-muted/40 p-4"
        action={(formData) => {
          startTransition(async () => {
            const result = await suggestSchoolAction(initialState, formData);
            setSuggestionState(result);
          });
        }}
      >
        <h2 className="text-sm font-semibold">School missing?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px]">
          <Input name="name" placeholder="School name" />
          <Input name="state" placeholder="State" />
        </div>
        <input type="hidden" name="country" value="Nigeria" />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AuthFormMessage message={suggestionState.message} ok={suggestionState.ok} />
          <Button type="submit" variant="secondary" disabled={pending}>
            Submit suggestion
          </Button>
        </div>
      </form>
    </div>
  );
}
