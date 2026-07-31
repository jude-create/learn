# Phase 1 Audit And Implementation Plan

## Current Architecture

Learn Big is a Next.js 15 App Router application using TypeScript, Tailwind CSS, Supabase Auth, Supabase Postgres, Supabase Storage and RLS. Prisma has now been added as the trusted server-side ORM layer for application database work. The current product is an instructor-led learning platform with public course browsing, instructor course authoring, modules, lessons, enrolments, lesson progress, comments, comment votes, notifications and role dashboards.

Authentication is server-action based through Supabase email/password and Google OAuth. A database trigger creates `profiles` from Auth metadata and prevents users from self-registering as Admin. Session protection lives in `src/lib/auth/session.ts` and `src/lib/supabase/middleware.ts`.

Supabase configuration is split across browser, server and admin clients. The service role client is isolated in trusted server code. Migrations currently create the learning-course schema, RLS policies and storage buckets for course thumbnails, avatars and lesson media. Prisma is configured through `prisma/schema.prisma` and a server-only singleton at `src/lib/prisma.ts`.

## Reusable Features

- Next.js App Router structure in `src/app`
- Supabase Auth and cookie session refresh
- Existing role-based dashboard shell
- Tailwind theme tokens and UI primitives
- React Hook Form and Zod validation style
- Server actions for protected mutations
- Existing comments, replies and voting patterns
- RLS-first database style
- Vitest setup for utility and validation tests
- Prisma baseline schema mapped to the existing Supabase tables

## Problems To Correct

- Existing `courses` table represents instructor-led courses, not university course hubs.
- Registration previously allowed users to self-select `instructor`.
- Profiles did not store school, department, programme or onboarding status.
- No academic hierarchy existed for schools, departments and university course codes.
- No material upload, approval, duplicate hash, private material storage or signed download flow existed.
- No download-credit, upload reward or reputation event tables existed.
- Course moderator assignment was not course-scoped.
- Analytics were limited to simple dashboard counts.
- README and seed data described the old learning-course MVP.
- `package-lock.json` still needs to be regenerated after installing the new Prisma and upload/preview dependencies.

## Architectural Decision

The Phase 1 migration adds the academic platform schema beside the existing learning-course schema instead of renaming or deleting working tables. This avoids breaking existing pages while the MVP is transitioned feature by feature.

The new academic course table is named `academic_courses` to avoid clashing with the existing instructor-led `courses` table. Public routes can later expose these as `/schools/[schoolSlug]/courses/[courseSlug]` while old `/courses` pages are gradually retired or repurposed.

Course moderators are assignments in `course_moderators`; they are not a global role. The existing global roles remain `student`, `instructor` and `admin` only for compatibility with the current app, but new registration creates students only.

Prisma is introduced as a baseline mapping of the current tables. Because SQL migrations already created the existing tables, the next application schema change should be made through Prisma migrations. Supabase SQL migrations should be reserved for Auth triggers, RLS, Storage policies, database permissions and special security functions.

## Proposed Folder Structure

```txt
src/
  app/
    (auth)/onboarding/
    (public)/schools/
    (public)/materials/
    (public)/discussions/
    dashboard/
    moderation/
    upload/
    settings/profile/
  components/
    academic/
    auth/
    comments/
    discussions/
    materials/
    moderation/
    ui/
  lib/
    actions/
    auth/
    prisma.ts
    supabase/
    validations/
  server/
    auth/
    services/
  types/
prisma/
  schema.prisma
  README.md
supabase/
  migrations/
  seed.sql
```

## Database Changes Required

Phase 1 adds profile onboarding columns, schools, departments, academic courses, suggestions, materials, votes, material comments, discussions, answers, answer votes, course moderators, content flags, download events, upload rewards, reputation events, system settings and a private `materials` storage bucket.

It also adds indexes, RLS policies and helper functions for course-code normalisation, UTC monthly cycles, moderator checks, reputation totals, download allowance, material approval and controlled download recording.

The proposed Prisma schema is implemented in `prisma/schema.prisma`. It maps existing snake_case tables to Prisma models such as `Profile`, `School`, `Department`, `AcademicCourse`, `Material`, `DiscussionThread`, `CourseModerator`, `DownloadEvent`, `UploadReward`, `ReputationEvent` and `SystemSetting`.

## Phase Plan

1. Foundation: Prisma baseline, schema, RLS, onboarding, utilities, seed data and documentation.
2. Course hub and navigation: schools, departments, academic course search and course pages.
3. Materials: upload flow, SHA-256 hash, duplicate detection, pending review, material detail and preview.
4. Download credits: signed URLs, allowance UI, repeat-download handling and dashboard credit cards.
5. Discussions and voting: threads, answers, accepted answers and reputation events.
6. Moderation: pending materials, flags, duplicate handling and scoped moderator dashboard.
7. Profiles and analytics: public profiles, upload history, reputation summary and admin metrics.
8. Quality and deployment: responsive polish, Playwright smoke flows, README setup and production checks.

## Verification Notes

- TypeScript source diagnostics were clean before adding Prisma.
- After adding Prisma, diagnostics report only missing `@prisma/client` module declarations because `npm install` could not run in this Codex Windows session.
- `npm install` was attempted and failed before execution with `Access is denied.`
- Run `npm install`, `npm run prisma:generate`, `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm run test` and `npm run build` locally once process execution is available.

## Phase 2 Progress

Implemented:

- Public school browsing at `/schools`
- School detail pages with department filters at `/schools/[schoolSlug]`
- Department pages at `/schools/[schoolSlug]/departments/[departmentSlug]`
- Academic course hub pages at `/schools/[schoolSlug]/courses/[courseSlug]`
- Global search at `/search`
- Course suggestion form and server action
- Reusable `SchoolCard` and `CourseCard` components
- Public navigation updates for Schools and Search

The Phase 2 source passes TypeScript diagnostics through the local TypeScript API. Full `npm run test` and `npm run build` still need to be run in the user's PowerShell because Codex shell process execution is denied in this session.
