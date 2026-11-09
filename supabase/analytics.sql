-- USAPhO Guide first-party analytics.
-- Vercel's free plan keeps 31 days and has no custom events. This keeps every
-- page view and key action forever, in our own database, with no third party.
-- Run once in the Supabase SQL editor (safe to re-run).

create table if not exists public.analytics_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  event       text not null check (char_length(event) between 1 and 48),
  path        text check (char_length(path) <= 300),
  referrer    text check (char_length(referrer) <= 300),
  utm_source  text check (char_length(utm_source) <= 80),
  utm_medium  text check (char_length(utm_medium) <= 80),
  utm_campaign text check (char_length(utm_campaign) <= 120),
  visitor_id  uuid,            -- random id kept in localStorage, not tied to a person
  session_id  uuid,            -- resets after 30 minutes idle
  user_id     uuid references auth.users on delete set null,
  country     text check (char_length(country) <= 8),
  tz          text check (char_length(tz) <= 64),
  lang        text check (char_length(lang) <= 24),
  device      text check (device in ('mobile','tablet','desktop')),
  props       jsonb not null default '{}'::jsonb check (pg_column_size(props) < 2048)
);

create index if not exists analytics_events_created_idx on public.analytics_events (created_at);
create index if not exists analytics_events_event_idx on public.analytics_events (event, created_at);
create index if not exists analytics_events_visitor_idx on public.analytics_events (visitor_id);

alter table public.analytics_events enable row level security;

-- Anyone may write an event; nobody may read them through the public API.
-- A signed-in reader may only attach their own user id.
drop policy if exists "anyone can record an event" on public.analytics_events;
create policy "anyone can record an event"
  on public.analytics_events for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

revoke select, update, delete on public.analytics_events from anon, authenticated;
grant insert on public.analytics_events to anon, authenticated;

-- Reports live in their own schema, which the public API does not expose.
create schema if not exists analytics;

create or replace view analytics.daily as
select (created_at at time zone 'America/Los_Angeles')::date as day,
       count(distinct visitor_id) filter (where event = 'pageview') as visitors,
       count(distinct session_id) filter (where event = 'pageview') as sessions,
       count(*) filter (where event = 'pageview') as pageviews,
       count(*) filter (where event = 'signup') as signups,
       count(*) filter (where event = 'problem_check') as problem_checks,
       count(*) filter (where event = 'problem_check' and (props->>'ok')::boolean) as problems_correct,
       count(*) filter (where event = 'quickcheck') as quickchecks,
       count(*) filter (where event = 'discord_click') as discord_clicks
from public.analytics_events
group by 1 order by 1;

-- First thing that brought each visitor in: a utm_source if the link had one,
-- otherwise the referring site.
create or replace view analytics.first_touch as
select distinct on (visitor_id)
       visitor_id, created_at as first_seen,
       coalesce(nullif(utm_source,''),
                nullif(regexp_replace(referrer, '^https?://(www\.)?([^/]+).*$', '\2'), ''),
                'direct') as source,
       utm_campaign, path as landing_page, country, tz, device
from public.analytics_events
where event = 'pageview' and visitor_id is not null
order by visitor_id, created_at;

create or replace view analytics.sources as
select f.source,
       count(*) as visitors,
       count(*) filter (where exists (select 1 from public.analytics_events e
                                      where e.visitor_id = f.visitor_id and e.event = 'signup')) as signups,
       count(*) filter (where exists (select 1 from public.analytics_events e
                                      where e.visitor_id = f.visitor_id and e.event = 'discord_click')) as discord_clicks
from analytics.first_touch f
group by 1 order by 2 desc;

create or replace view analytics.top_pages as
select path, count(*) as pageviews, count(distinct visitor_id) as visitors
from public.analytics_events where event = 'pageview'
group by 1 order by 3 desc;

create or replace view analytics.all_time as
select (select min(created_at) from public.analytics_events) as tracking_since,
       count(distinct visitor_id) filter (where event = 'pageview') as visitors,
       count(distinct session_id) filter (where event = 'pageview') as sessions,
       count(*) filter (where event = 'pageview') as pageviews,
       count(distinct visitor_id) filter (where event = 'pageview' and visitor_id in (
         select visitor_id from public.analytics_events where event = 'pageview'
         group by visitor_id having count(distinct (created_at at time zone 'UTC')::date) > 1)) as returning_visitors,
       count(*) filter (where event = 'signup') as signups,
       count(*) filter (where event = 'problem_check') as problem_checks,
       count(*) filter (where event = 'problem_check' and (props->>'ok')::boolean) as problems_correct,
       count(*) filter (where event = 'quickcheck') as quickchecks,
       count(*) filter (where event = 'pdf_export') as pdf_exports,
       count(*) filter (where event = 'discord_click') as discord_clicks,
       count(distinct country) filter (where country is not null) as countries,
       (select count(*) from auth.users) as accounts
from public.analytics_events;

revoke all on schema analytics from anon, authenticated;

-- Live stats for admins on /stats. Checks the caller's role itself, so it is
-- safe to expose as an RPC.
create or replace function public.analytics_summary(days int default 30)
returns jsonb
language plpgsql
security definer set search_path = public, analytics
as $$
declare
  result jsonb;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and 'admin' = any(roles)) then
    raise exception 'not allowed';
  end if;
  select jsonb_build_object(
    'all_time', (select to_jsonb(a) from analytics.all_time a),
    'daily', (select coalesce(jsonb_agg(to_jsonb(d) order by d.day), '[]') from analytics.daily d
              where d.day > (now() at time zone 'America/Los_Angeles')::date - days),
    'sources', (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from (select * from analytics.sources limit 25) s),
    'pages', (select coalesce(jsonb_agg(to_jsonb(p)), '[]') from (select * from analytics.top_pages limit 25) p),
    'countries', (select coalesce(jsonb_agg(to_jsonb(c)), '[]') from (
        select country, count(*) as visitors from analytics.first_touch
        where country is not null group by 1 order by 2 desc limit 25) c),
    'accounts_by_week', (select coalesce(jsonb_agg(to_jsonb(w) order by w.week), '[]') from (
        select date_trunc('week', created_at)::date as week, count(*) as signups
        from auth.users group by 1) w)
  ) into result;
  return result;
end;
$$;

revoke all on function public.analytics_summary(int) from public, anon;
grant execute on function public.analytics_summary(int) to authenticated;
