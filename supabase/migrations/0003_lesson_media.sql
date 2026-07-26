alter table public.lessons
  add column if not exists document_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'lesson-videos',
    'lesson-videos',
    true,
    524288000,
    array['video/mp4', 'video/webm', 'video/quicktime']
  ),
  (
    'lesson-documents',
    'lesson-documents',
    true,
    52428800,
    array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ]
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Instructors upload lesson videos" on storage.objects;
drop policy if exists "Instructors update own lesson videos" on storage.objects;
drop policy if exists "Instructors delete own lesson videos" on storage.objects;
drop policy if exists "Instructors upload lesson documents" on storage.objects;
drop policy if exists "Instructors update own lesson documents" on storage.objects;
drop policy if exists "Instructors delete own lesson documents" on storage.objects;
drop policy if exists "Public reads lesson media buckets" on storage.objects;

create policy "Public reads lesson media buckets" on storage.objects
  for select using (bucket_id in ('lesson-videos', 'lesson-documents'));

create policy "Instructors upload lesson videos" on storage.objects
  for insert with check (
    bucket_id = 'lesson-videos'
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Instructors update own lesson videos" on storage.objects
  for update using (
    bucket_id = 'lesson-videos'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
  )
  with check (
    bucket_id = 'lesson-videos'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
  );

create policy "Instructors delete own lesson videos" on storage.objects
  for delete using (
    bucket_id = 'lesson-videos'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
  );

create policy "Instructors upload lesson documents" on storage.objects
  for insert with check (
    bucket_id = 'lesson-documents'
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Instructors update own lesson documents" on storage.objects
  for update using (
    bucket_id = 'lesson-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
  )
  with check (
    bucket_id = 'lesson-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
  );

create policy "Instructors delete own lesson documents" on storage.objects
  for delete using (
    bucket_id = 'lesson-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
  );
