-- Run in Supabase → SQL Editor. Active user = installation with last_seen within 15 min (app heartbeat every ~5 min).
create table admins(user_id uuid primary key references auth.users on delete cascade);
create or replace function is_admin() returns boolean language sql security definer stable set search_path=public as $$select exists(select 1 from admins where user_id=auth.uid())$$;
create table releases(
 id uuid primary key default gen_random_uuid(), version text unique not null check(length(version)<=32),
 release_date date not null default current_date, download_url text not null default '', file_size text,
 status text not null default 'draft' check(status in('draft','published','archived')), is_latest boolean not null default false,
 new_features text[] not null default '{}', improvements text[] not null default '{}', bug_fixes text[] not null default '{}', other_changes text[] not null default '{}',
 created_at timestamptz default now(), updated_at timestamptz default now());
create unique index one_latest on releases(is_latest) where is_latest;
create or replace function one_latest() returns trigger language plpgsql as $$begin new.updated_at=now(); if new.is_latest then update releases set is_latest=false where is_latest and id<>new.id; end if; return new; end$$;
create trigger t_latest before insert or update on releases for each row execute function one_latest();
create table installations(installation_id text primary key check(length(installation_id) between 8 and 64), version text, first_seen timestamptz default now(), last_seen timestamptz default now());
create table analytics_events(id bigserial primary key, event_type text not null check(event_type in('download','update')), installation_id text, version text, created_at timestamptz default now());
create index on installations(last_seen);
alter table admins enable row level security; alter table releases enable row level security; alter table installations enable row level security; alter table analytics_events enable row level security;
create policy "public read published" on releases for select using(status='published');
create policy "admin all releases" on releases for all using(is_admin()) with check(is_admin());
create policy "admin read events" on analytics_events for select using(is_admin());
create policy "admin read installs" on installations for select using(is_admin());
-- Public RPCs (security definer, validated). Tables themselves are not writable by anon.
create or replace function track_download(p_version text) returns void language plpgsql security definer set search_path=public as $$
begin if length(coalesce(p_version,''))>32 then return; end if;
 -- basic abuse limit: max 200 download events per minute globally
 if (select count(*) from analytics_events where event_type='download' and created_at>now()-interval '1 minute')>200 then return; end if;
 insert into analytics_events(event_type,version) values('download',p_version); end$$;
create or replace function app_heartbeat(p_installation text, p_version text) returns void language plpgsql security definer set search_path=public as $$
declare old text;
begin if length(coalesce(p_installation,'')) not between 8 and 64 or length(coalesce(p_version,''))>32 then return; end if;
 select version into old from installations where installation_id=p_installation;
 insert into installations(installation_id,version) values(p_installation,p_version)
  on conflict(installation_id) do update set version=excluded.version,last_seen=now();
 if old is not null and old<>p_version then insert into analytics_events(event_type,installation_id,version) values('update',p_installation,p_version); end if; end$$;
create or replace function get_public_stats() returns table(downloads bigint,updates bigint,active_users bigint) language sql security definer stable set search_path=public as $$
 select (select count(*) from analytics_events where event_type='download'),(select count(*) from analytics_events where event_type='update'),(select count(*) from installations where last_seen>now()-interval '15 minutes')$$;
create or replace function admin_version_distribution() returns table(version text,installs bigint) language sql security definer stable set search_path=public as $$
 select version,count(*) from installations where is_admin() group by version order by 2 desc$$;
grant execute on function track_download(text),app_heartbeat(text,text),get_public_stats() to anon,authenticated;
grant execute on function admin_version_distribution() to authenticated;
-- After creating your admin user in Authentication → Users:
-- insert into admins(user_id) values('<YOUR-USER-UUID>');
