# Phase 7 End-to-End QA

Use this checklist against the running app and your real Supabase project.

## Before Testing

Run the app:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

Make sure these migrations have been applied:

- `supabase/migrations/0001_foundation.sql`
- `supabase/migrations/0002_comment_profile_visibility.sql`
- `supabase/migrations/0003_lesson_media.sql`
- `supabase/migrations/0004_security_hardening.sql`

## Student Flow

1. Register a new student with email/password.
2. Confirm the student lands on `/dashboard/student` after login.
3. Use the dashboard `Home` and `Browse courses` links.
4. Open `/courses`.
5. Search for a course by title or category.
6. Open a published course detail page.
7. Enrol in the course.
8. Confirm the enrol button shows a loading state.
9. Confirm the student is redirected into the first lesson.
10. Mark the lesson complete.
11. Confirm dashboard completed lesson count updates after refresh.
12. Add a top-level comment.
13. Edit that comment.
14. Delete that comment.

## Instructor Flow

1. Register or log in as an instructor.
2. Confirm login redirects to `/dashboard/instructor`.
3. Create a draft course.
4. Upload a thumbnail.
5. Add a module.
6. Add a lesson with text content.
7. Upload a lesson video.
8. Upload a lesson document.
9. Publish the course.
10. Confirm the publish button shows a loading state.
11. Visit the public course page.
12. Confirm the course appears in `/courses`.
13. Rename a module.
14. Move a module up/down.
15. Edit a lesson.
16. Move a lesson up/down.
17. Unpublish the course.
18. Confirm it no longer appears in the public course list.

## Discussion Flow

Use two accounts enrolled in the same course.

1. Student A posts a top-level comment.
2. Student B replies to Student A.
3. Confirm no reply button appears on Student B's reply.
4. Student B upvotes Student A's comment.
5. Student B clicks again to remove the upvote.
6. Instructor opens the same lesson.
7. Instructor pins Student A's comment.
8. Instructor marks Student A's comment accepted.
9. Instructor marks another comment accepted.
10. Confirm only one accepted answer remains.

## Admin Flow

1. Log in as admin.
2. Open `/dashboard/admin/users`.
3. Search/filter users.
4. Suspend a non-admin user.
5. Confirm the suspended user cannot perform protected actions.
6. Reactivate that user.
7. Open `/dashboard/admin/courses`.
8. Unpublish a published course.
9. Open `/dashboard/admin/comments`.
10. Delete a recent comment.

## Negative Permission Checks

These are the most important security checks:

- Student cannot open lesson content before enrolment.
- Student cannot create or edit courses.
- Instructor cannot edit another instructor's course.
- Instructor cannot access `/dashboard/admin`.
- Suspended student cannot comment, vote or mark progress.
- Suspended instructor cannot add modules, lessons or uploads.
- Replies to replies are rejected by the database.
- Duplicate enrolments are prevented.
- Duplicate votes are prevented.

## Local Verification Commands

Run these after browser testing:

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

Fix any failures before deployment.
