drop policy if exists "Authenticated users view active profiles for discussions" on public.profiles;

create policy "Authenticated users view active profiles for discussions" on public.profiles
  for select using (auth.uid() is not null and is_suspended = false);
