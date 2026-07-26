create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('student', 'instructor', 'admin')),
  avatar_url text,
  bio text,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  thumbnail_url text,
  category text not null,
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  instructor_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (course_id, position)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  slug text not null,
  content text not null,
  video_url text,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug),
  unique (module_id, position)
);

create table if not exists public.enrolments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  content text not null,
  is_pinned boolean not null default false,
  is_accepted_answer boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comment_votes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('reply_received', 'comment_upvoted', 'comment_accepted', 'new_lesson_published')),
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists courses_status_idx on public.courses(status);
create index if not exists courses_instructor_idx on public.courses(instructor_id);
create index if not exists modules_course_idx on public.course_modules(course_id);
create index if not exists lessons_module_idx on public.lessons(module_id);
create index if not exists enrolments_student_idx on public.enrolments(student_id);
create index if not exists comments_lesson_idx on public.comments(lesson_id);
create index if not exists comments_parent_idx on public.comments(parent_comment_id);
create unique index if not exists comments_one_accepted_answer_per_lesson
  on public.comments(lesson_id)
  where is_accepted_answer;

create or replace view public.public_lesson_outline as
select
  l.id as lesson_id,
  l.title as lesson_title,
  l.slug as lesson_slug,
  l.position as lesson_position,
  m.id as module_id,
  m.title as module_title,
  m.position as module_position,
  c.id as course_id,
  c.slug as course_slug
from public.lessons l
join public.course_modules m on m.id = l.module_id
join public.courses c on c.id = m.course_id
where c.status = 'published';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(not is_suspended, false) from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'
$$;

create or replace function public.course_owner(course_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select instructor_id from public.courses where id = course_id
$$;

create or replace function public.lesson_course(lesson_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.course_id
  from public.lessons l
  join public.course_modules m on m.id = l.module_id
  where l.id = lesson_id
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

create or replace function public.user_owns_comment_course(comment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.comments co
    join public.lessons l on l.id = co.lesson_id
    join public.course_modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where co.id = comment_id
      and c.instructor_id = auth.uid()
  )
$$;

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
  );

  return new;
end;
$$;

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change roles.';
  end if;

  if new.role = 'admin' and not public.is_admin() then
    raise exception 'Only admins can grant admin role.';
  end if;

  if new.is_suspended is distinct from old.is_suspended and not public.is_admin() then
    raise exception 'Only admins can change suspension status.';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_replies_to_replies()
returns trigger
language plpgsql
as $$
declare
  parent_parent uuid;
begin
  if new.parent_comment_id is null then
    return new;
  end if;

  select parent_comment_id into parent_parent
  from public.comments
  where id = new.parent_comment_id;

  if parent_parent is not null then
    raise exception 'Replies to replies are not allowed.';
  end if;

  return new;
end;
$$;

create or replace function public.protect_comment_update_fields()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.lesson_id is distinct from old.lesson_id
    or new.user_id is distinct from old.user_id
    or new.parent_comment_id is distinct from old.parent_comment_id then
    raise exception 'Comment ownership and lesson fields cannot be changed.';
  end if;

  if new.content is distinct from old.content and old.user_id <> auth.uid() then
    raise exception 'Only the comment author can edit comment content.';
  end if;

  if (
    new.is_pinned is distinct from old.is_pinned
    or new.is_accepted_answer is distinct from old.is_accepted_answer
  ) and not public.user_owns_comment_course(old.id) then
    raise exception 'Only the course instructor can moderate comments.';
  end if;

  if old.user_id = auth.uid()
    and not public.user_owns_comment_course(old.id)
    and (
      new.is_pinned is distinct from old.is_pinned
      or new.is_accepted_answer is distinct from old.is_accepted_answer
    ) then
    raise exception 'Comment authors cannot moderate their own comments unless they own the course.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
drop trigger if exists courses_updated_at on public.courses;
drop trigger if exists lessons_updated_at on public.lessons;
drop trigger if exists comments_updated_at on public.comments;
drop trigger if exists lesson_progress_updated_at on public.lesson_progress;
drop trigger if exists profiles_prevent_role_change on public.profiles;
drop trigger if exists comments_prevent_deep_replies on public.comments;
drop trigger if exists comments_protect_update_fields on public.comments;
drop trigger if exists on_auth_user_created on auth.users;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();
create trigger lessons_updated_at before update on public.lessons
  for each row execute function public.set_updated_at();
create trigger comments_updated_at before update on public.comments
  for each row execute function public.set_updated_at();
create trigger lesson_progress_updated_at before update on public.lesson_progress
  for each row execute function public.set_updated_at();
create trigger profiles_prevent_role_change before update on public.profiles
  for each row execute function public.prevent_profile_role_change();
create trigger comments_prevent_deep_replies before insert or update on public.comments
  for each row execute function public.prevent_replies_to_replies();
create trigger comments_protect_update_fields before update on public.comments
  for each row execute function public.protect_comment_update_fields();
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrolments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.comments enable row level security;
alter table public.comment_votes enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Profiles are visible to owners and admins" on public.profiles;
drop policy if exists "Instructor basics are public" on public.profiles;
drop policy if exists "Users update their own profile" on public.profiles;
drop policy if exists "Admins manage profiles" on public.profiles;
drop policy if exists "Published courses are public" on public.courses;
drop policy if exists "Instructors view own courses" on public.courses;
drop policy if exists "Admins view all courses" on public.courses;
drop policy if exists "Instructors create own courses" on public.courses;
drop policy if exists "Instructors update own courses" on public.courses;
drop policy if exists "Instructors delete draft courses" on public.courses;
drop policy if exists "Admins manage courses" on public.courses;
drop policy if exists "Published course modules are public" on public.course_modules;
drop policy if exists "Course instructors manage modules" on public.course_modules;
drop policy if exists "Lesson access is protected" on public.lessons;
drop policy if exists "Course instructors manage lessons" on public.lessons;
drop policy if exists "Students view own enrolments" on public.enrolments;
drop policy if exists "Instructors view course enrolments" on public.enrolments;
drop policy if exists "Admins view enrolments" on public.enrolments;
drop policy if exists "Students enrol themselves in published courses" on public.enrolments;
drop policy if exists "Students manage own progress" on public.lesson_progress;
drop policy if exists "Instructors view course progress" on public.lesson_progress;
drop policy if exists "Admins view progress" on public.lesson_progress;
drop policy if exists "Lesson participants view comments" on public.comments;
drop policy if exists "Lesson participants create comments" on public.comments;
drop policy if exists "Authors edit own comment content" on public.comments;
drop policy if exists "Authors delete own comments" on public.comments;
drop policy if exists "Instructors moderate owned course comments" on public.comments;
drop policy if exists "Admins manage comments" on public.comments;
drop policy if exists "Users view votes on accessible comments" on public.comment_votes;
drop policy if exists "Users create own votes" on public.comment_votes;
drop policy if exists "Users delete own votes" on public.comment_votes;
drop policy if exists "Users view own notifications" on public.notifications;
drop policy if exists "Users update own notifications" on public.notifications;
drop policy if exists "Admins manage notifications" on public.notifications;

create policy "Profiles are visible to owners and admins" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "Instructor basics are public" on public.profiles
  for select using (role = 'instructor' and is_suspended = false);
create policy "Users update their own profile" on public.profiles
  for update using (id = auth.uid() and public.current_user_is_active())
  with check (id = auth.uid() and public.current_user_is_active());
create policy "Admins manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Published courses are public" on public.courses
  for select using (status = 'published');
create policy "Instructors view own courses" on public.courses
  for select using (instructor_id = auth.uid());
create policy "Admins view all courses" on public.courses
  for select using (public.is_admin());
create policy "Instructors create own courses" on public.courses
  for insert with check (
    instructor_id = auth.uid()
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
  );
create policy "Instructors update own courses" on public.courses
  for update using (
    instructor_id = auth.uid()
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
  )
  with check (instructor_id = auth.uid());
create policy "Instructors delete draft courses" on public.courses
  for delete using (
    instructor_id = auth.uid()
    and status = 'draft'
    and public.current_user_role() = 'instructor'
  );
create policy "Admins manage courses" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Published course modules are public" on public.course_modules
  for select using (exists (select 1 from public.courses c where c.id = course_id and c.status = 'published'));
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

create policy "Lesson access is protected" on public.lessons
  for select using (public.user_can_access_lesson(id) or public.is_admin());
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

create policy "Students view own enrolments" on public.enrolments
  for select using (student_id = auth.uid());
create policy "Instructors view course enrolments" on public.enrolments
  for select using (public.course_owner(course_id) = auth.uid());
create policy "Admins view enrolments" on public.enrolments
  for select using (public.is_admin());
create policy "Students enrol themselves in published courses" on public.enrolments
  for insert with check (
    student_id = auth.uid()
    and public.current_user_role() = 'student'
    and public.current_user_is_active()
    and exists (select 1 from public.courses c where c.id = course_id and c.status = 'published')
  );

create policy "Students manage own progress" on public.lesson_progress
  for all using (student_id = auth.uid())
  with check (
    student_id = auth.uid()
    and public.current_user_role() = 'student'
    and public.current_user_is_active()
    and public.user_can_access_lesson(lesson_id)
  );
create policy "Instructors view course progress" on public.lesson_progress
  for select using (
    exists (
      select 1
      from public.lessons l
      join public.course_modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id = lesson_id and c.instructor_id = auth.uid()
    )
  );
create policy "Admins view progress" on public.lesson_progress
  for select using (public.is_admin());

create policy "Lesson participants view comments" on public.comments
  for select using (public.user_can_access_lesson(lesson_id) or public.is_admin());
create policy "Lesson participants create comments" on public.comments
  for insert with check (
    user_id = auth.uid()
    and public.current_user_is_active()
    and public.user_can_access_lesson(lesson_id)
    and is_pinned = false
    and is_accepted_answer = false
  );
create policy "Authors edit own comment content" on public.comments
  for update using (user_id = auth.uid() and public.current_user_is_active())
  with check (user_id = auth.uid());
create policy "Authors delete own comments" on public.comments
  for delete using (user_id = auth.uid());
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
create policy "Admins manage comments" on public.comments
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Users view votes on accessible comments" on public.comment_votes
  for select using (
    exists (
      select 1 from public.comments c
      where c.id = comment_id and public.user_can_access_lesson(c.lesson_id)
    )
  );
create policy "Users create own votes" on public.comment_votes
  for insert with check (
    user_id = auth.uid()
    and public.current_user_is_active()
    and exists (
      select 1 from public.comments c
      where c.id = comment_id and public.user_can_access_lesson(c.lesson_id)
    )
  );
create policy "Users delete own votes" on public.comment_votes
  for delete using (user_id = auth.uid());

create policy "Users view own notifications" on public.notifications
  for select using (user_id = auth.uid());
create policy "Users update own notifications" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Admins manage notifications" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('course-thumbnails', 'course-thumbnails', true, 3145728, array['image/jpeg', 'image/png', 'image/webp']),
  ('profile-avatars', 'profile-avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own avatars" on storage.objects;
drop policy if exists "Users update own avatars" on storage.objects;
drop policy if exists "Users delete own avatars" on storage.objects;
drop policy if exists "Public reads image buckets" on storage.objects;
drop policy if exists "Instructors upload course thumbnails" on storage.objects;
drop policy if exists "Instructors update own course thumbnails" on storage.objects;
drop policy if exists "Instructors delete own course thumbnails" on storage.objects;

create policy "Users upload own avatars" on storage.objects
  for insert with check (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
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
create policy "Public reads image buckets" on storage.objects
  for select using (bucket_id in ('profile-avatars', 'course-thumbnails'));
create policy "Instructors upload course thumbnails" on storage.objects
  for insert with check (
    bucket_id = 'course-thumbnails'
    and public.current_user_role() = 'instructor'
    and public.current_user_is_active()
    and auth.uid()::text = (storage.foldername(name))[1]
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
