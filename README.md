# Learn Big

Learn Big is a portfolio-ready MVP for collaborative online learning. Students can enrol in courses, read lessons, track progress and discuss lessons through comments, replies, votes, pinned comments and accepted answers. Educators can author structured courses across coding, secondary school subjects and university topics.

The app uses only the requested application stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, Supabase Postgres, Supabase Storage, Supabase RLS, React Hook Form, Zod, Lucide React and Sonner.

No separate backend server is used.

## Features

- Email/password registration and login
- Google sign-in
- Student and instructor registration
- Manually created admin accounts
- Profile creation trigger from Auth metadata
- Role-based dashboard redirects
- Protected dashboard and lesson routes
- Suspended-user checks in middleware, server actions and RLS
- Public landing page, course browsing, search, filters and pagination
- Course details with module and lesson outline
- Instructor course creation and editing
- Course thumbnail upload
- Module and lesson management with move up/down ordering
- Lesson text content, external video URLs, uploaded videos and uploaded documents
- Course publishing, unpublishing and draft deletion
- Student enrolment in published courses
- Student course dashboard and progress calculation
- Lesson reader with navigation and completion tracking
- Comments, replies, votes, owner editing and deletion
- Instructor pinning and accepted-answer moderation
- Admin user, course and comment management
- Loading states for slow server actions
- Zod validation tests for core form schemas

## Screenshots

Add screenshots after connecting the app to your Supabase project:

- Landing page
- Course catalog
- Course details
- Student dashboard
- Lesson reader with discussion
- Instructor course editor
- Admin dashboard

## Folder Structure

```txt
src/
  app/
    (auth)/
    (public)/
    auth/callback/
    dashboard/
    learn/
  components/
    admin/
    auth/
    comments/
    courses/
    dashboard/
    lessons/
    ui/
  lib/
    actions/
    auth/
    supabase/
    validations/
  types/
docs/
supabase/
  migrations/
  seed.sql
  storage.md
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use the service role key only in trusted server-side code. Never expose it to client components.

## Supabase Setup

1. Create a Supabase project.
2. Enable email/password authentication.
3. For local development, set `NEXT_PUBLIC_APP_URL` to `http://localhost:3000`.
4. Add `http://localhost:3000/auth/callback` to allowed redirect URLs.
5. Run all migrations in order:

```txt
supabase/migrations/0001_foundation.sql
supabase/migrations/0002_comment_profile_visibility.sql
supabase/migrations/0003_lesson_media.sql
supabase/migrations/0004_security_hardening.sql
```

The migrations create the database schema, triggers, views, RLS policies and storage buckets.

## Google Sign-In Setup

In Google Cloud Console:

1. Open Google Auth Platform or APIs & Services credentials.
2. Create an OAuth client ID for a web application.
3. Add this Authorized JavaScript origin for local development:

```txt
http://localhost:3000
```

4. Add this Authorized redirect URI, replacing the project ref with your project ref:

```txt
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

In Supabase:

1. Open Authentication -> Sign In / Providers -> Google.
2. Enable Google.
3. Paste the Google Client ID and Client Secret.
4. Open Authentication -> URL Configuration.
5. Set the local Site URL to:

```txt
http://localhost:3000
```

6. Add this redirect URL:

```txt
http://localhost:3000/auth/callback
```

For production, also add your Vercel domain as a Site URL/redirect URL in Supabase and as an Authorized JavaScript origin in Google Cloud.

## Database And RLS

The database includes:

- `profiles`
- `courses`
- `course_modules`
- `lessons`
- `enrolments`
- `lesson_progress`
- `comments`
- `comment_votes`
- `notifications`

RLS is enabled on every application table. Policies enforce student ownership, instructor course ownership, lesson access, admin actions, duplicate enrolment prevention, duplicate vote prevention and suspended-user restrictions.

The `handle_new_user` trigger creates a profile when a user is created in Auth. It accepts only `student` and `instructor` from registration metadata. Invalid roles, including `admin`, are coerced to `student`.

## Storage

See `supabase/storage.md` for the complete storage setup.

Buckets:

- `course-thumbnails`
- `profile-avatars`
- `lesson-videos`
- `lesson-documents`

Files are stored under paths scoped by the authenticated user ID. Lesson media buckets are public for the MVP, while the app and RLS protect access to lesson pages.

## Seed Data

`supabase/seed.sql` contains demo profiles, courses, modules, lessons, enrolments, progress, comments and votes.

Important: create matching Supabase Auth users first, then replace the placeholder UUIDs in `seed.sql` with the generated `auth.users.id` values. Do not commit real passwords.

Recommended test users:

- One admin
- Two instructors
- Four students

Admin accounts should be created manually by updating an existing profile role to `admin` in Supabase.

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

If a stale development build causes unusual runtime errors, clear the Next.js cache:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

## Verification

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Then follow:

- `docs/phase-6-supabase-hardening.md`
- `docs/phase-7-end-to-end-qa.md`

## Deployment

Deploy the Next.js app to Vercel:

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add all environment variables from `.env.example`.
4. Set `NEXT_PUBLIC_APP_URL` to the production URL.
5. Run the Supabase migrations against the production Supabase project.
6. Configure Supabase Auth production redirect URLs:

```txt
https://YOUR_DOMAIN/auth/callback
```

7. Configure Google OAuth production origins and redirect URI:

```txt
https://YOUR_DOMAIN
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

8. Run `npm run build` before publishing.

Supabase hosts the database, authentication and storage. Vercel hosts the Next.js application.

## Known MVP Limitations

- Notifications exist in the schema but are not surfaced in the UI.
- Lesson media buckets are public for simple MVP rendering.
- Replaced storage files are not automatically deleted in every UI flow.
- Admin UI is intentionally functional and simple.
- Full RLS integration tests should be added once Supabase local tooling is available.
