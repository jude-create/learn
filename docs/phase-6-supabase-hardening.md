# Phase 6 Supabase Hardening Checklist

Run these migrations in order if they have not already been applied:

1. `supabase/migrations/0003_lesson_media.sql`
2. `supabase/migrations/0004_security_hardening.sql`

Use the Supabase SQL Editor for a hosted project, or the Supabase CLI for a local project.

## Accounts To Create

Create at least these real Auth users in Supabase or through the app:

- One student
- One instructor
- One admin profile created manually
- One suspended student

Admin registration should not be possible from the public register page.

## Authentication Checks

- Email/password student login redirects to `/dashboard/student`.
- Email/password instructor login redirects to `/dashboard/instructor`.
- Admin login redirects to `/dashboard/admin`.
- Google sign-in creates a student profile by default.
- Google-created profiles use the Google display name when available.
- Suspended users are redirected away from protected pages.

## Instructor Checks

- Instructor can create a draft course.
- Instructor can upload a course thumbnail.
- Instructor can add modules and lessons.
- Instructor can upload lesson videos and documents.
- Instructor can publish a course only after it has lessons.
- Instructor cannot edit another instructor's course.
- Suspended instructor cannot create or update course content.

## Student Checks

- Student can browse published courses.
- Student can enrol only in published courses.
- Student can open full lessons only after enrolment.
- Student can mark lessons complete.
- Student cannot enrol another user.
- Suspended student cannot access protected lesson content.

## Discussion Checks

- Enrolled users can create comments.
- Replies can only be added to top-level comments.
- Replies to replies are rejected.
- Users can edit and delete only their own comments.
- Users can upvote once and remove their own upvote.
- Duplicate votes are rejected by the database.
- Course instructor can pin and unpin comments.
- Course instructor can mark one accepted answer per lesson.
- Accepting a new answer removes the previous accepted answer.
- Suspended users cannot comment, vote, or moderate.

## Admin Checks

- Admin can view users, courses and recent comments.
- Admin can suspend and reactivate users.
- Admin can unpublish courses.
- Admin can delete inappropriate comments.
- Admin cannot suspend their own account through the app action.

## Notes

Lesson media buckets are public for the MVP so uploaded video and document URLs can be rendered directly by the lesson reader. Use random file names and do not expose lesson URLs to unenrolled users from the app.
