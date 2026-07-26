create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'student');

  if requested_role not in ('student', 'instructor') then
    requested_role := 'student';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
      nullif(trim(coalesce(new.raw_user_meta_data->>'name', '')), ''),
      nullif(trim(coalesce(new.raw_user_meta_data->>'user_name', '')), ''),
      split_part(new.email, '@', 1),
      'New user'
    ),
    requested_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.user_can_access_lesson(lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where l.id = lesson_id
      and auth.uid() is not null
      and public.current_user_is_active()
      and (
        public.is_admin()
        or c.instructor_id = auth.uid()
        or exists (
          select 1
          from public.enrolments e
          where e.course_id = c.id
            and e.student_id = auth.uid()
        )
      )
  )
$$;

drop policy if exists "Course instructors manage modules" on public.course_modules;
drop policy if exists "Course instructors manage lessons" on public.lessons;
drop policy if exists "Instructors moderate owned course comments" on public.comments;

create policy "Course instructors manage modules" on public.course_modules
  for all using (
    public.is_admin()
    or (
      public.course_owner(course_id) = auth.uid()
      and public.current_user_role() = 'instructor'
      and public.current_user_is_active()
    )
  )
  with check (
    public.is_admin()
    or (
      public.course_owner(course_id) = auth.uid()
      and public.current_user_role() = 'instructor'
      and public.current_user_is_active()
    )
  );

create policy "Course instructors manage lessons" on public.lessons
  for all using (
    exists (
      select 1
      from public.course_modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and (
          public.is_admin()
          or (
            c.instructor_id = auth.uid()
            and public.current_user_role() = 'instructor'
            and public.current_user_is_active()
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.course_modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and (
          public.is_admin()
          or (
            c.instructor_id = auth.uid()
            and public.current_user_role() = 'instructor'
            and public.current_user_is_active()
          )
        )
    )
  );

create policy "Instructors moderate owned course comments" on public.comments
  for update using (
    public.user_owns_comment_course(id)
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
  )
  with check (
    public.user_owns_comment_course(id)
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
  );

drop policy if exists "Users update own avatars" on storage.objects;
drop policy if exists "Users delete own avatars" on storage.objects;
drop policy if exists "Instructors update own course thumbnails" on storage.objects;
drop policy if exists "Instructors delete own course thumbnails" on storage.objects;
drop policy if exists "Instructors update own lesson videos" on storage.objects;
drop policy if exists "Instructors delete own lesson videos" on storage.objects;
drop policy if exists "Instructors update own lesson documents" on storage.objects;
drop policy if exists "Instructors delete own lesson documents" on storage.objects;

create policy "Users update own avatars" on storage.objects
  for update using (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_is_active()
  )
  with check (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_is_active()
  );

create policy "Users delete own avatars" on storage.objects
  for delete using (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_is_active()
  );

create policy "Instructors update own course thumbnails" on storage.objects
  for update using (
    bucket_id = 'course-thumbnails'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
  )
  with check (
    bucket_id = 'course-thumbnails'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
  );

create policy "Instructors delete own course thumbnails" on storage.objects
  for delete using (
    bucket_id = 'course-thumbnails'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
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
