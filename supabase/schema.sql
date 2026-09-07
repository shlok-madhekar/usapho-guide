-- USAPhO Guide auth schema.
-- Run this once in the Supabase SQL editor for your project.

-- 1. Profiles table: one row per auth user, holding contributor roles.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  display_name text,
  roles text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone signed in can read profiles (the UI shows names and role badges).
drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users may edit their own display name, but never their own roles.
drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and roles = (select p.roles from public.profiles p where p.id = auth.uid())
  );

-- 2. Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Backfill profiles for any users that already exist.
insert into public.profiles (id, email, display_name)
select u.id, u.email, split_part(u.email, '@', 1)
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Granting roles (run as needed, from the SQL editor):
--
--   update public.profiles set roles = '{course_writer}'   where email = 'someone@example.com';
--   update public.profiles set roles = '{problem_writer}'  where email = 'someone@example.com';
--   update public.profiles set roles = '{admin}'           where email = 'you@example.com';
--   update public.profiles set roles = '{course_writer,problem_writer}' where email = '...';
--
-- Roles are intentionally only settable here (RLS blocks self-promotion).
-- ---------------------------------------------------------------------------
