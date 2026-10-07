-- Patheyo v18 — Supabase → SQL Editor-এ পুরোটা একবার Run করুন। (বারবার Run করলেও ক্ষতি নেই)
-- সক্রিয় ব্যবহারকারী = শেষ ১৫ মিনিটে অ্যাপ থেকে হার্টবিট পাঠানো ইনস্টলেশন (অ্যাপ সামনে থাকলে ~৫ মিনিটে একবার)।
-- শুধু বেনামী ইনস্টলেশন আইডি, ভার্সন, ফোনের মডেল ও অ্যান্ড্রয়েড ভার্সন রাখা হয় — কোনো ব্যক্তিগত তথ্য নয়।

create table if not exists admins(user_id uuid primary key references auth.users on delete cascade);
create or replace function is_admin() returns boolean language sql security definer stable set search_path=public as $$select exists(select 1 from admins where user_id=auth.uid())$$;

create table if not exists releases(
 id uuid primary key default gen_random_uuid(), version text unique not null check(length(version)<=32),
 release_date date not null default current_date, download_url text not null default '', file_size text,
 status text not null default 'draft' check(status in('draft','published','archived')), is_latest boolean not null default false,
 new_features text[] not null default '{}', improvements text[] not null default '{}', bug_fixes text[] not null default '{}', other_changes text[] not null default '{}',
 created_at timestamptz default now(), updated_at timestamptz default now());
create unique index if not exists one_latest on releases(is_latest) where is_latest;
create or replace function one_latest() returns trigger language plpgsql as $$begin new.updated_at=now(); if new.is_latest then update releases set is_latest=false where is_latest and id<>new.id; end if; return new; end$$;
drop trigger if exists t_latest on releases;
create trigger t_latest before insert or update on releases for each row execute function one_latest();

create table if not exists installations(installation_id text primary key check(length(installation_id) between 8 and 64), version text, first_seen timestamptz default now(), last_seen timestamptz default now());
-- v18: নতুন কলাম (আগের টেবিল থাকলেও নিরাপদে যোগ হবে)
alter table installations add column if not exists version_code bigint;
alter table installations add column if not exists device text;
alter table installations add column if not exists android text;
alter table installations add column if not exists last_bg timestamptz;
alter table installations add column if not exists open_count bigint not null default 0;
create index if not exists installations_last_seen on installations(last_seen);
create index if not exists installations_version on installations(version);

create table if not exists analytics_events(id bigserial primary key, event_type text not null check(event_type in('download','update')), installation_id text, version text, created_at timestamptz default now());
create index if not exists analytics_events_type_time on analytics_events(event_type,created_at);

-- v18: পাঠানো নোটিফিকেশনের ইতিহাস
create table if not exists notifications(
 id bigserial primary key, kind text not null default 'announcement' check(kind in('announcement','app_update')),
 title text not null, message text not null, link text, image text,
 target text not null default 'all', status text not null default 'sent', detail text,
 sent_by text, created_at timestamptz default now());

alter table admins enable row level security; alter table releases enable row level security;
alter table installations enable row level security; alter table analytics_events enable row level security;
alter table notifications enable row level security;
drop policy if exists "public read published" on releases; create policy "public read published" on releases for select using(status='published');
drop policy if exists "admin all releases" on releases; create policy "admin all releases" on releases for all using(is_admin()) with check(is_admin());
drop policy if exists "admin read events" on analytics_events; create policy "admin read events" on analytics_events for select using(is_admin());
drop policy if exists "admin read installs" on installations; create policy "admin read installs" on installations for select using(is_admin());
drop policy if exists "admin read notifications" on notifications; create policy "admin read notifications" on notifications for select using(is_admin());
drop policy if exists "admin read self" on admins; create policy "admin read self" on admins for select using(user_id=auth.uid());

-- ===== পাবলিক RPC (ভ্যালিডেশনসহ; টেবিলে সরাসরি লেখার অনুমতি নেই) =====
create or replace function track_download(p_version text) returns void language plpgsql security definer set search_path=public as $$
begin if length(coalesce(p_version,''))>32 then return; end if;
 if (select count(*) from analytics_events where event_type='download' and created_at>now()-interval '1 minute')>200 then return; end if;
 insert into analytics_events(event_type,version) values('download',p_version); end$$;

-- আগের (২ প্যারামিটারের) ফাংশন থাকলে সরিয়ে নতুনটা বসানো হচ্ছে। নতুন প্যারামিটারগুলোর ডিফল্ট আছে, তাই শুধু (installation, version) দিয়ে ডাকলেও কাজ করে।
drop function if exists app_heartbeat(text,text);
create or replace function app_heartbeat(p_installation text, p_version text, p_version_code bigint default null, p_device text default null, p_android text default null, p_source text default 'open')
returns void language plpgsql security definer set search_path=public as $$
declare old text; v text:=left(coalesce(p_version,''),32);
begin
 if length(coalesce(p_installation,'')) not between 8 and 64 or length(v)=0 then return; end if;
 select version into old from installations where installation_id=p_installation;
 if old is null then
  insert into installations(installation_id,version,version_code,device,android,last_seen,last_bg,open_count)
  values(p_installation,v,p_version_code,left(p_device,60),left(p_android,16),case when p_source='bg' then now()-interval '1 day' else now() end,case when p_source='bg' then now() end,case when p_source='bg' then 0 else 1 end)
  on conflict(installation_id) do nothing;
 else
  if p_source='bg' then
   update installations set version=v,version_code=coalesce(p_version_code,version_code),device=coalesce(left(p_device,60),device),android=coalesce(left(p_android,16),android),last_bg=now() where installation_id=p_installation;
  else
   update installations set version=v,version_code=coalesce(p_version_code,version_code),device=coalesce(left(p_device,60),device),android=coalesce(left(p_android,16),android),last_seen=now(),open_count=open_count+(case when last_seen<now()-interval '15 minutes' then 1 else 0 end) where installation_id=p_installation;
  end if;
  if old<>v then insert into analytics_events(event_type,installation_id,version) values('update',p_installation,v); end if;
 end if;
end$$;

create or replace function get_public_stats() returns table(downloads bigint,updates bigint,active_users bigint) language sql security definer stable set search_path=public as $$
 select (select count(*) from analytics_events where event_type='download'),(select count(*) from analytics_events where event_type='update'),(select count(*) from installations where last_seen>now()-interval '15 minutes')$$;

-- ===== শুধু অ্যাডমিনের জন্য =====
create or replace function admin_version_distribution() returns table(version text,installs bigint) language sql security definer stable set search_path=public as $$
 select version,count(*) from installations where is_admin() group by version order by 2 desc$$;

-- ড্যাশবোর্ডের সব সংখ্যা এক কলে (JSON)
create or replace function admin_dashboard(p_days int default 14) returns json language plpgsql security definer stable set search_path=public as $$
declare r json; d int:=least(greatest(coalesce(p_days,14),7),90);
begin
 if not is_admin() then return null; end if;
 select json_build_object(
  'total_installs',(select count(*) from installations),
  'active_15m',(select count(*) from installations where last_seen>now()-interval '15 minutes'),
  'active_24h',(select count(*) from installations where last_seen>now()-interval '24 hours'),
  'active_7d',(select count(*) from installations where last_seen>now()-interval '7 days'),
  'active_30d',(select count(*) from installations where last_seen>now()-interval '30 days'),
  'new_today',(select count(*) from installations where first_seen>=date_trunc('day',now())),
  'new_7d',(select count(*) from installations where first_seen>now()-interval '7 days'),
  'downloads',(select count(*) from analytics_events where event_type='download'),
  'updates',(select count(*) from analytics_events where event_type='update'),
  'versions',(select coalesce(json_agg(x order by x.installs desc),'[]'::json) from (select coalesce(version,'?') as version,count(*) as installs,count(*) filter(where last_seen>now()-interval '7 days') as active_7d,count(*) filter(where last_seen>now()-interval '15 minutes') as online_now from installations group by version) x),
  'android',(select coalesce(json_agg(x order by x.installs desc),'[]'::json) from (select coalesce(android,'?') as android,count(*) as installs from installations group by android order by 2 desc limit 8) x),
  'devices',(select coalesce(json_agg(x order by x.installs desc),'[]'::json) from (select coalesce(device,'?') as device,count(*) as installs from installations group by device order by 2 desc limit 10) x),
  'daily',(select coalesce(json_agg(x order by x.day),'[]'::json) from (
     select g::date as day,
       (select count(*) from installations i where i.first_seen::date=g::date) as new_installs,
       (select count(*) from installations i where i.last_seen::date=g::date) as active,
       (select count(*) from analytics_events e where e.event_type='download' and e.created_at::date=g::date) as downloads
     from generate_series((now()-((d-1)||' days')::interval)::date,now()::date,'1 day') g) x)
 ) into r;
 return r;
end$$;

-- কে কোন ভার্সনে: ইনস্টলেশনের তালিকা (ফিল্টার + পেজিং)
create or replace function admin_installations(p_version text default null, p_search text default null, p_limit int default 50, p_offset int default 0)
returns table(installation_id text,version text,version_code bigint,device text,android text,first_seen timestamptz,last_seen timestamptz,open_count bigint,total_count bigint)
language sql security definer stable set search_path=public as $$
 select i.installation_id,i.version,i.version_code,i.device,i.android,i.first_seen,i.last_seen,i.open_count,count(*) over() as total_count
 from installations i
 where is_admin() and (p_version is null or p_version='' or i.version=p_version)
   and (p_search is null or p_search='' or i.installation_id ilike '%'||p_search||'%' or i.device ilike '%'||p_search||'%')
 order by i.last_seen desc limit least(greatest(coalesce(p_limit,50),1),200) offset greatest(coalesce(p_offset,0),0)$$;

grant execute on function track_download(text),get_public_stats() to anon,authenticated;
grant execute on function app_heartbeat(text,text,bigint,text,text,text) to anon,authenticated;
grant execute on function admin_version_distribution(),admin_dashboard(int),admin_installations(text,text,int,int) to authenticated;
revoke execute on function admin_dashboard(int),admin_installations(text,text,int,int),admin_version_distribution() from anon;

-- অ্যাডমিন ইউজার বানানোর পর (Authentication → Users → Add user), একবার চালান:
-- insert into admins(user_id) values('<আপনার-user-uuid>');
