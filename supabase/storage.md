# Supabase Storage Setup

The migrations create these public buckets:

- `course-thumbnails`, max 3 MB
- `profile-avatars`, max 2 MB
- `lesson-videos`, max 500 MB
- `lesson-documents`, max 50 MB

Allowed image MIME types:

- `image/jpeg`
- `image/png`
- `image/webp`

Allowed lesson video MIME types:

- `video/mp4`
- `video/webm`
- `video/quicktime`

Allowed lesson document MIME types:

- `application/pdf`
- `application/msword`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.ms-powerpoint`
- `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- `text/plain`

Use paths scoped by the authenticated user ID:

- Avatars: `{user_id}/{generated_filename}.webp`
- Course thumbnails: `{instructor_id}/{course_id}/{generated_filename}.webp`
- Lesson videos: `{instructor_id}/{generated_filename}.{extension}`
- Lesson documents: `{instructor_id}/{generated_filename}.{extension}`

RLS policies allow users to manage files only inside their own top-level folder. Public reads are enabled for image display.

Lesson media buckets are public for the MVP so lesson pages can render uploaded videos and document links directly after the app has enforced lesson access.
