create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists username text unique,
  add column if not exists school_id uuid,
  add column if not exists department_id uuid,
  add column if not exists programme text,
  add column if not exists graduation_year integer,
  add column if not exists onboarding_completed boolean not null default false;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  country text not null default 'Nigeria',
  state text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (school_id, slug)
);

create table if not exists public.academic_courses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  course_code text not null,
  normalised_course_code text not null,
  title text not null,
  slug text not null,
  description text not null default '',
  academic_level integer,
  semester text check (semester in ('first', 'second', 'summer', 'full-year')),
  status text not null default 'active' check (status in ('pending', 'active', 'archived', 'rejected')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, department_id, normalised_course_code),
  unique (school_id, slug)
);

create table if not exists public.school_suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default 'Nigeria',
  state text,
  suggested_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.course_suggestions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  course_code text not null,
  normalised_course_code text not null,
  course_title text not null,
  academic_level integer,
  semester text check (semester in ('first', 'second', 'summer', 'full-year')),
  suggested_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.academic_courses(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  material_type text not null check (material_type in ('notes', 'lecture_slides', 'past_exam', 'assignment', 'tutorial', 'project_resource', 'study_guide', 'other')),
  academic_session text,
  semester text check (semester in ('first', 'second', 'summer', 'full-year')),
  storage_path text not null unique,
  original_file_name text not null,
  safe_file_name text,
  file_extension text,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  file_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'removed', 'duplicate')),
  replaces_material_id uuid references public.materials(id),
  original_source text,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  download_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.material_votes (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vote_value integer not null check (vote_value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (material_id, user_id)
);

create table if not exists public.material_comments (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.material_comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.discussion_threads (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.academic_courses(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  is_locked boolean not null default false,
  is_pinned boolean not null default false,
  accepted_answer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discussion_answers (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.discussion_threads(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.discussion_threads
  drop constraint if exists discussion_threads_accepted_answer_id_fkey,
  add constraint discussion_threads_accepted_answer_id_fkey
    foreign key (accepted_answer_id) references public.discussion_answers(id) on delete set null;

create table if not exists public.answer_votes (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.discussion_answers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vote_value integer not null check (vote_value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (answer_id, user_id)
);

create table if not exists public.course_moderators (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.academic_courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id),
  is_active boolean not null default true,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  removed_at timestamptz,
  unique (course_id, user_id)
);

create table if not exists public.content_flags (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('material', 'material_comment', 'discussion_thread', 'discussion_answer')),
  target_id uuid not null,
  course_id uuid not null references public.academic_courses(id) on delete cascade,
  reason text not null check (reason in ('duplicate_material', 'updated_version', 'wrong_course', 'wrong_school', 'low_quality', 'incorrect_information', 'spam', 'copyright_concern', 'offensive_content', 'other')),
  description text,
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved', 'dismissed')),
  assigned_moderator_id uuid references public.profiles(id),
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (reporter_id, target_type, target_id, reason)
);

create table if not exists public.download_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  cycle_start timestamptz not null,
  cycle_end timestamptz not null,
  is_first_download_in_cycle boolean not null default true,
  credit_consumed integer not null default 1 check (credit_consumed in (0, 1)),
  downloaded_at timestamptz not null default now()
);

create table if not exists public.upload_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  cycle_start timestamptz not null,
  cycle_end timestamptz not null,
  credits_awarded integer not null check (credits_awarded >= 0),
  created_at timestamptz not null default now(),
  unique (material_id)
);

create table if not exists public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  points integer not null,
  entity_type text not null,
  entity_id uuid not null,
  unique_event_key text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  drop constraint if exists profiles_school_id_fkey,
  add constraint profiles_school_id_fkey foreign key (school_id) references public.schools(id) on delete set null,
  drop constraint if exists profiles_department_id_fkey,
  add constraint profiles_department_id_fkey foreign key (department_id) references public.departments(id) on delete set null;

create index if not exists departments_school_idx on public.departments(school_id);
create index if not exists academic_courses_school_idx on public.academic_courses(school_id);
create index if not exists academic_courses_department_idx on public.academic_courses(department_id);
create index if not exists academic_courses_normalised_code_idx on public.academic_courses(normalised_course_code);
create index if not exists materials_course_status_idx on public.materials(course_id, status);
create index if not exists materials_uploader_idx on public.materials(uploader_id);
create index if not exists materials_file_hash_idx on public.materials(file_hash);
create index if not exists material_votes_material_idx on public.material_votes(material_id);
create index if not exists discussion_threads_course_idx on public.discussion_threads(course_id);
create index if not exists discussion_answers_thread_idx on public.discussion_answers(thread_id);
create index if not exists course_moderators_user_idx on public.course_moderators(user_id) where is_active;
create index if not exists content_flags_course_status_idx on public.content_flags(course_id, status);
create index if not exists download_events_user_cycle_idx on public.download_events(user_id, cycle_start);
create index if not exists download_events_material_cycle_idx on public.download_events(material_id, cycle_start);
create unique index if not exists download_events_one_first_per_cycle
  on public.download_events(user_id, material_id, cycle_start)
  where is_first_download_in_cycle;
create index if not exists reputation_events_user_idx on public.reputation_events(user_id);

create or replace function public.normalise_course_code(value text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(value, ''), '[^A-Za-z0-9]+', '', 'g'))
$$;

create or replace function public.current_cycle_start()
returns timestamptz
language sql
stable
as $$
  select date_trunc('month', now() at time zone 'utc') at time zone 'utc'
$$;

create or replace function public.current_cycle_end()
returns timestamptz
language sql
stable
as $$
  select public.current_cycle_start() + interval '1 month'
$$;

create or replace function public.is_course_moderator(course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_moderators cm
    where cm.course_id = $1
      and cm.user_id = auth.uid()
      and cm.is_active
  )
$$;

create or replace function public.user_reputation(user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(points), 0)::integer
  from public.reputation_events
  where reputation_events.user_id = $1
$$;

create or replace function public.get_user_download_allowance(target_user_id uuid, target_cycle_start timestamptz default public.current_cycle_start())
returns table (
  base_downloads integer,
  upload_bonus integer,
  downloads_used integer,
  downloads_remaining integer,
  cycle_start timestamptz,
  cycle_end timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  base_value integer;
  max_bonus integer;
  raw_bonus integer;
  used_value integer;
  cycle_end_value timestamptz;
begin
  base_value := coalesce((select (value #>> '{}')::integer from public.system_settings where key = 'base_monthly_downloads'), 5);
  max_bonus := coalesce((select (value #>> '{}')::integer from public.system_settings where key = 'maximum_monthly_upload_bonus'), 10);
  cycle_end_value := target_cycle_start + interval '1 month';

  select coalesce(sum(credits_awarded), 0)::integer into raw_bonus
  from public.upload_rewards
  where user_id = target_user_id
    and cycle_start = target_cycle_start;

  select coalesce(sum(credit_consumed), 0)::integer into used_value
  from public.download_events
  where user_id = target_user_id
    and cycle_start = target_cycle_start;

  return query select
    base_value,
    least(raw_bonus, max_bonus),
    used_value,
    greatest(base_value + least(raw_bonus, max_bonus) - used_value, 0),
    target_cycle_start,
    cycle_end_value;
end;
$$;

create or replace function public.prevent_material_replies_to_replies()
returns trigger
language plpgsql
as $$
begin
  if new.parent_comment_id is not null and exists (
    select 1 from public.material_comments where id = new.parent_comment_id and parent_comment_id is not null
  ) then
    raise exception 'Replies to replies are not allowed.';
  end if;

  return new;
end;
$$;

create or replace function public.approve_material(material_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  material_record public.materials%rowtype;
  reward_value integer;
begin
  select * into material_record from public.materials where id = material_id for update;
  if not found or material_record.status <> 'pending' then
    raise exception 'Material is not pending.';
  end if;

  if not (public.is_admin() or public.is_course_moderator(material_record.course_id)) then
    raise exception 'Not authorised to approve this material.';
  end if;

  reward_value := coalesce((select (value #>> '{}')::integer from public.system_settings where key = 'approved_upload_reward'), 2);

  update public.materials
  set status = 'approved',
      approved_by = auth.uid(),
      approved_at = now(),
      updated_at = now()
  where id = material_record.id;

  insert into public.upload_rewards (user_id, material_id, cycle_start, cycle_end, credits_awarded)
  values (material_record.uploader_id, material_record.id, public.current_cycle_start(), public.current_cycle_end(), reward_value)
  on conflict (material_id) do nothing;

  insert into public.reputation_events (user_id, event_type, points, entity_type, entity_id, unique_event_key, description)
  values (
    material_record.uploader_id,
    'approved_upload',
    10,
    'material',
    material_record.id,
    'approved_upload:' || material_record.id::text,
    'Material approved'
  )
  on conflict (unique_event_key) do nothing;
end;
$$;

create or replace function public.record_material_download(material_id uuid)
returns table (storage_path text, credit_consumed integer, downloads_remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  material_record public.materials%rowtype;
  allowance record;
  existing_event boolean;
  consumed integer;
begin
  if auth.uid() is null or not public.current_user_is_active() then
    raise exception 'Authentication required.';
  end if;

  select * into material_record from public.materials where id = material_id;
  if not found or material_record.status <> 'approved' then
    raise exception 'Material is not available.';
  end if;

  existing_event := exists (
    select 1 from public.download_events
    where user_id = auth.uid()
      and material_id = material_record.id
      and cycle_start = public.current_cycle_start()
  );

  consumed := case when material_record.uploader_id = auth.uid() or existing_event then 0 else 1 end;

  select * into allowance from public.get_user_download_allowance(auth.uid(), public.current_cycle_start());
  if consumed = 1 and allowance.downloads_remaining <= 0 then
    raise exception 'Monthly download allowance exhausted.';
  end if;

  insert into public.download_events (
    user_id,
    material_id,
    cycle_start,
    cycle_end,
    is_first_download_in_cycle,
    credit_consumed
  )
  values (
    auth.uid(),
    material_record.id,
    public.current_cycle_start(),
    public.current_cycle_end(),
    not existing_event,
    consumed
  );

  update public.materials
  set download_count = download_count + 1
  where id = material_record.id;

  return query select
    material_record.storage_path,
    consumed,
    greatest(allowance.downloads_remaining - consumed, 0);
end;
$$;

drop trigger if exists academic_courses_updated_at on public.academic_courses;
drop trigger if exists materials_updated_at on public.materials;
drop trigger if exists material_votes_updated_at on public.material_votes;
drop trigger if exists material_comments_updated_at on public.material_comments;
drop trigger if exists discussion_threads_updated_at on public.discussion_threads;
drop trigger if exists discussion_answers_updated_at on public.discussion_answers;
drop trigger if exists answer_votes_updated_at on public.answer_votes;
drop trigger if exists material_comments_prevent_deep_replies on public.material_comments;

create trigger academic_courses_updated_at before update on public.academic_courses
  for each row execute function public.set_updated_at();
create trigger materials_updated_at before update on public.materials
  for each row execute function public.set_updated_at();
create trigger material_votes_updated_at before update on public.material_votes
  for each row execute function public.set_updated_at();
create trigger material_comments_updated_at before update on public.material_comments
  for each row execute function public.set_updated_at();
create trigger discussion_threads_updated_at before update on public.discussion_threads
  for each row execute function public.set_updated_at();
create trigger discussion_answers_updated_at before update on public.discussion_answers
  for each row execute function public.set_updated_at();
create trigger answer_votes_updated_at before update on public.answer_votes
  for each row execute function public.set_updated_at();
create trigger material_comments_prevent_deep_replies before insert or update on public.material_comments
  for each row execute function public.prevent_material_replies_to_replies();

alter table public.schools enable row level security;
alter table public.departments enable row level security;
alter table public.academic_courses enable row level security;
alter table public.school_suggestions enable row level security;
alter table public.course_suggestions enable row level security;
alter table public.materials enable row level security;
alter table public.material_votes enable row level security;
alter table public.material_comments enable row level security;
alter table public.discussion_threads enable row level security;
alter table public.discussion_answers enable row level security;
alter table public.answer_votes enable row level security;
alter table public.course_moderators enable row level security;
alter table public.content_flags enable row level security;
alter table public.download_events enable row level security;
alter table public.upload_rewards enable row level security;
alter table public.reputation_events enable row level security;
alter table public.system_settings enable row level security;

create policy "Verified schools are public" on public.schools for select using (is_verified or public.is_admin());
create policy "Admins manage schools" on public.schools for all using (public.is_admin()) with check (public.is_admin());
create policy "Departments are public" on public.departments for select using (true);
create policy "Admins manage departments" on public.departments for all using (public.is_admin()) with check (public.is_admin());
create policy "Active academic courses are public" on public.academic_courses for select using (status = 'active' or public.is_admin());
create policy "Admins manage academic courses" on public.academic_courses for all using (public.is_admin()) with check (public.is_admin());
create policy "Users create school suggestions" on public.school_suggestions for insert with check (suggested_by = auth.uid() and public.current_user_is_active());
create policy "Users view own school suggestions" on public.school_suggestions for select using (suggested_by = auth.uid() or public.is_admin());
create policy "Admins manage school suggestions" on public.school_suggestions for all using (public.is_admin()) with check (public.is_admin());
create policy "Users create course suggestions" on public.course_suggestions for insert with check (suggested_by = auth.uid() and public.current_user_is_active());
create policy "Users view own course suggestions" on public.course_suggestions for select using (suggested_by = auth.uid() or public.is_admin());
create policy "Admins manage course suggestions" on public.course_suggestions for all using (public.is_admin()) with check (public.is_admin());
create policy "Approved materials are public" on public.materials for select using (status = 'approved' or uploader_id = auth.uid() or public.is_admin() or public.is_course_moderator(course_id));
create policy "Students upload own materials" on public.materials for insert with check (uploader_id = auth.uid() and public.current_user_role() = 'student' and public.current_user_is_active());
create policy "Owners edit pending materials" on public.materials for update using (uploader_id = auth.uid() and status = 'pending' and public.current_user_is_active()) with check (uploader_id = auth.uid());
create policy "Moderators review assigned materials" on public.materials for update using ((public.is_admin() or public.is_course_moderator(course_id)) and public.current_user_is_active()) with check (public.is_admin() or public.is_course_moderator(course_id));
create policy "Users manage own material votes" on public.material_votes for all using (user_id = auth.uid() and public.current_user_is_active()) with check (user_id = auth.uid() and public.current_user_is_active());
create policy "Votes are visible for approved materials" on public.material_votes for select using (exists (select 1 from public.materials m where m.id = material_id and m.status = 'approved'));
create policy "Material comments are visible" on public.material_comments for select using (exists (select 1 from public.materials m where m.id = material_id and (m.status = 'approved' or m.uploader_id = auth.uid() or public.is_admin() or public.is_course_moderator(m.course_id))));
create policy "Users create material comments" on public.material_comments for insert with check (user_id = auth.uid() and public.current_user_is_active());
create policy "Users edit own material comments" on public.material_comments for update using (user_id = auth.uid() and public.current_user_is_active()) with check (user_id = auth.uid());
create policy "Course discussions are visible" on public.discussion_threads for select using (exists (select 1 from public.academic_courses c where c.id = course_id and c.status = 'active'));
create policy "Users create course discussions" on public.discussion_threads for insert with check (author_id = auth.uid() and public.current_user_is_active());
create policy "Authors edit own unlocked discussions" on public.discussion_threads for update using (author_id = auth.uid() and not is_locked and public.current_user_is_active()) with check (author_id = auth.uid());
create policy "Moderators manage discussions" on public.discussion_threads for update using (public.is_admin() or public.is_course_moderator(course_id)) with check (public.is_admin() or public.is_course_moderator(course_id));
create policy "Discussion answers are visible" on public.discussion_answers for select using (exists (select 1 from public.discussion_threads t where t.id = thread_id));
create policy "Users create discussion answers" on public.discussion_answers for insert with check (author_id = auth.uid() and public.current_user_is_active());
create policy "Users edit own discussion answers" on public.discussion_answers for update using (author_id = auth.uid() and public.current_user_is_active()) with check (author_id = auth.uid());
create policy "Users manage own answer votes" on public.answer_votes for all using (user_id = auth.uid() and public.current_user_is_active()) with check (user_id = auth.uid() and public.current_user_is_active());
create policy "Course moderators are public" on public.course_moderators for select using (true);
create policy "Admins manage course moderators" on public.course_moderators for all using (public.is_admin()) with check (public.is_admin());
create policy "Users create content flags" on public.content_flags for insert with check (reporter_id = auth.uid() and public.current_user_is_active());
create policy "Users view own flags" on public.content_flags for select using (reporter_id = auth.uid() or public.is_admin() or public.is_course_moderator(course_id));
create policy "Moderators resolve course flags" on public.content_flags for update using (public.is_admin() or public.is_course_moderator(course_id)) with check (public.is_admin() or public.is_course_moderator(course_id));
create policy "Users view own downloads" on public.download_events for select using (user_id = auth.uid() or public.is_admin());
create policy "Users view own upload rewards" on public.upload_rewards for select using (user_id = auth.uid() or public.is_admin());
create policy "Reputation is visible" on public.reputation_events for select using (true);
create policy "Admins manage system settings" on public.system_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Settings are readable" on public.system_settings for select using (true);

insert into public.system_settings (key, value, description)
values
  ('base_monthly_downloads', '5'::jsonb, 'Free downloads granted at the start of each UTC calendar month.'),
  ('approved_upload_reward', '2'::jsonb, 'Download credits awarded when a material is approved.'),
  ('maximum_monthly_upload_bonus', '10'::jsonb, 'Maximum upload reward credits a user can earn in one cycle.'),
  ('maximum_upload_file_size_mb', '25'::jsonb, 'Maximum upload file size for academic materials.'),
  ('signed_url_expiry_seconds', '120'::jsonb, 'Expiry in seconds for preview and download signed URLs.')
on conflict (key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials',
  'materials',
  false,
  26214400,
  array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Students upload academic materials" on storage.objects;
drop policy if exists "Students read own academic material uploads" on storage.objects;
drop policy if exists "Students update own academic material uploads" on storage.objects;
drop policy if exists "Students delete own unreviewed academic material uploads" on storage.objects;

create policy "Students upload academic materials" on storage.objects
  for insert with check (
    bucket_id = 'materials'
    and public.current_user_role() = 'student'
    and public.current_user_is_active()
    and auth.uid()::text in ((storage.foldername(name))[3], (storage.foldername(name))[4])
  );

create policy "Students read own academic material uploads" on storage.objects
  for select using (
    bucket_id = 'materials'
    and auth.uid()::text in ((storage.foldername(name))[3], (storage.foldername(name))[4])
    and public.current_user_is_active()
  );

create policy "Students update own academic material uploads" on storage.objects
  for update using (
    bucket_id = 'materials'
    and auth.uid()::text in ((storage.foldername(name))[3], (storage.foldername(name))[4])
    and public.current_user_is_active()
  )
  with check (
    bucket_id = 'materials'
    and auth.uid()::text in ((storage.foldername(name))[3], (storage.foldername(name))[4])
    and public.current_user_is_active()
  );

create policy "Students delete own unreviewed academic material uploads" on storage.objects
  for delete using (
    bucket_id = 'materials'
    and auth.uid()::text in ((storage.foldername(name))[3], (storage.foldername(name))[4])
    and public.current_user_is_active()
  );
