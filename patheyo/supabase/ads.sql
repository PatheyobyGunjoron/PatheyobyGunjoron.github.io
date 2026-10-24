-- Patheyo — অ্যাপ এড সিস্টেম (এড ট্যাব)  |  Supabase → SQL Editor-এ পুরোটা একবার Run করুন। (বারবার Run করলেও ক্ষতি নেই)
-- আগে schema.sql চালানো থাকতে হবে (is_admin() ফাংশন ও admins টেবিল সেখানেই বানানো)।
-- তিনটি জায়গা: carousel = হোম স্লাইডার (১২০০×৩৫০), footer = নিচের ব্যানার (১২০০×৪৫০), popup = অ্যাপ খুললে পপআপ (১২০০×১২০০)।

-- ===== সাধারণ সেটিংস (একটাই সারি) =====
create table if not exists app_ad_settings(
 id int primary key default 1 check(id=1),
 ads_enabled boolean not null default true,            -- মাস্টার সুইচ: বন্ধ করলে অ্যাপে সব এড বন্ধ
 carousel_enabled boolean not null default true,
 footer_enabled boolean not null default true,
 popup_enabled boolean not null default true,
 carousel_interval_sec int not null default 5 check(carousel_interval_sec between 2 and 30),
 builtin_fallback boolean not null default true,       -- কোনো জায়গায় সক্রিয় এড না থাকলে অ্যাপে বসানো ডিফল্ট এড দেখাবে
 updated_at timestamptz default now());
insert into app_ad_settings(id) values(1) on conflict (id) do nothing;

-- ===== এডের তালিকা =====
create table if not exists app_ads(
 id uuid primary key default gen_random_uuid(),
 title text not null check(length(title) between 1 and 120),                   -- শুধু আপনার চেনার নাম (অ্যাপে alt লেখা হিসেবেও যায়)
 placement text not null check(placement in('carousel','footer','popup')),
 image_url text not null check(image_url ~ '^https://' and length(image_url)<=1000),
 link_url text check(link_url is null or (link_url ~ '^https://' and length(link_url)<=1000)),   -- ওয়েবসাইট / প্রমোশনাল লিংক
 button_text text check(button_text is null or length(button_text)<=40),       -- পপআপের বাটনের লেখা
 promo_code text check(promo_code is null or length(promo_code)<=40),
 promo_note text check(promo_note is null or length(promo_note)<=80),          -- প্রমো কোডের পাশের ছোট লেখা, যেমন "২০% ছাড়"
 is_active boolean not null default true,
 start_at timestamptz, end_at timestamptz,                                      -- খালি = সীমা নেই
 sort_order int not null default 100,                                           -- ছোট সংখ্যা আগে দেখায়
 popup_frequency text not null default 'daily' check(popup_frequency in('every_open','daily','weekly','once')),
 popup_delay_sec int not null default 2 check(popup_delay_sec between 0 and 30),
 close_on_backdrop boolean not null default true,
 min_version_code bigint, max_version_code bigint,                              -- খালি = সব ভার্সন
 created_at timestamptz default now(), updated_at timestamptz default now());
create index if not exists app_ads_place on app_ads(placement,is_active,sort_order);

create or replace function ads_touch() returns trigger language plpgsql as $$begin new.updated_at=now(); return new; end$$;
drop trigger if exists t_ads_touch on app_ads; create trigger t_ads_touch before update on app_ads for each row execute function ads_touch();
drop trigger if exists t_ads_set_touch on app_ad_settings; create trigger t_ads_set_touch before update on app_ad_settings for each row execute function ads_touch();

-- ===== দৈনিক পরিসংখ্যান (ভিউ / ক্লিক / প্রমো কপি) =====
create table if not exists app_ad_daily(
 ad_id uuid not null references app_ads(id) on delete cascade,
 day date not null default current_date,
 views int not null default 0, clicks int not null default 0, copies int not null default 0,
 primary key(ad_id,day));

-- ===== নিরাপত্তা (RLS): সাধারণ মানুষ টেবিলে সরাসরি কিছু পড়তে/লিখতে পারে না; শুধু নিচের RPC দিয়ে =====
alter table app_ad_settings enable row level security; alter table app_ads enable row level security; alter table app_ad_daily enable row level security;
drop policy if exists "admin all ad settings" on app_ad_settings; create policy "admin all ad settings" on app_ad_settings for all using(is_admin()) with check(is_admin());
drop policy if exists "admin all ads" on app_ads; create policy "admin all ads" on app_ads for all using(is_admin()) with check(is_admin());
drop policy if exists "admin read ad daily" on app_ad_daily; create policy "admin read ad daily" on app_ad_daily for select using(is_admin());

-- ===== অ্যাপ যা ডাকে: এখন চালু এডগুলোর তালিকা =====
create or replace function get_app_ads(p_version_code bigint default null) returns json language sql security definer stable set search_path=public as $$
 select json_build_object(
  'settings', json_build_object(
    'enabled',   coalesce((select ads_enabled from app_ad_settings where id=1),true),
    'carousel',  coalesce((select carousel_enabled from app_ad_settings where id=1),true),
    'footer',    coalesce((select footer_enabled from app_ad_settings where id=1),true),
    'popup',     coalesce((select popup_enabled from app_ad_settings where id=1),true),
    'interval_ms', coalesce((select carousel_interval_sec from app_ad_settings where id=1),5)*1000,
    'fallback',  coalesce((select builtin_fallback from app_ad_settings where id=1),true)),
  'ads', (select coalesce(json_agg(json_build_object(
      'id',a.id,'p',a.placement,'img',a.image_url,'link',a.link_url,'btn',a.button_text,'promo',a.promo_code,'note',a.promo_note,
      'alt',a.title,'freq',a.popup_frequency,'delay',a.popup_delay_sec,'bd',a.close_on_backdrop) order by a.sort_order, a.created_at desc),'[]'::json)
    from app_ads a
    where a.is_active
      and (a.start_at is null or a.start_at<=now())
      and (a.end_at is null or a.end_at>now())
      and (p_version_code is null or ((a.min_version_code is null or p_version_code>=a.min_version_code) and (a.max_version_code is null or p_version_code<=a.max_version_code)))))
$$;

-- ===== অ্যাপ যা ডাকে: ভিউ / ক্লিক / কপি গণনা =====
create or replace function track_ad(p_ad uuid, p_event text) returns void language plpgsql security definer set search_path=public as $$
begin
 if p_event not in('view','click','copy') then return; end if;
 if not exists(select 1 from app_ads where id=p_ad) then return; end if;
 insert into app_ad_daily(ad_id,day,views,clicks,copies)
 values(p_ad,current_date,(p_event='view')::int,(p_event='click')::int,(p_event='copy')::int)
 on conflict(ad_id,day) do update set
   views=app_ad_daily.views+(p_event='view')::int, clicks=app_ad_daily.clicks+(p_event='click')::int, copies=app_ad_daily.copies+(p_event='copy')::int;
end$$;

-- ===== শুধু অ্যাডমিনের জন্য: প্রতিটি এডের মোট ও গত ৭ দিনের সংখ্যা =====
create or replace function admin_ads_stats() returns table(ad_id uuid, views bigint, clicks bigint, copies bigint, views_7d bigint, clicks_7d bigint)
language sql security definer stable set search_path=public as $$
 select d.ad_id, sum(d.views)::bigint, sum(d.clicks)::bigint, sum(d.copies)::bigint,
        coalesce(sum(d.views) filter(where d.day>current_date-7),0)::bigint, coalesce(sum(d.clicks) filter(where d.day>current_date-7),0)::bigint
 from app_ad_daily d where is_admin() group by d.ad_id$$;

-- ===== গত ১৪ দিনের মোট ভিউ/ক্লিক (অ্যাডমিন) =====
create or replace function admin_ads_daily(p_days int default 14) returns table(day date, views bigint, clicks bigint, copies bigint)
language sql security definer stable set search_path=public as $$
 select g::date, coalesce(sum(d.views),0)::bigint, coalesce(sum(d.clicks),0)::bigint, coalesce(sum(d.copies),0)::bigint
 from generate_series(current_date-(least(greatest(coalesce(p_days,14),7),90)-1), current_date, '1 day') g
 left join app_ad_daily d on d.day=g::date and is_admin()
 where is_admin() group by g order by g$$;

grant execute on function get_app_ads(bigint), track_ad(uuid,text) to anon, authenticated;
grant execute on function admin_ads_stats(), admin_ads_daily(int) to authenticated;
revoke execute on function admin_ads_stats(), admin_ads_daily(int) from anon;

-- ===== ছবি আপলোডের জায়গা (ঐচ্ছিক) — প্যানেল থেকে সরাসরি ছবি আপলোড করতে চাইলে। ব্যর্থ হলে বাকি সব ঠিকই কাজ করবে =====
do $$
begin
 insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('ads','ads',true,3145728,array['image/png','image/jpeg','image/webp','image/gif'])
 on conflict (id) do update set public=true, file_size_limit=3145728, allowed_mime_types=array['image/png','image/jpeg','image/webp','image/gif'];
 drop policy if exists "ads public read" on storage.objects;
 create policy "ads public read" on storage.objects for select using (bucket_id='ads');
 drop policy if exists "ads admin insert" on storage.objects;
 create policy "ads admin insert" on storage.objects for insert to authenticated with check (bucket_id='ads' and public.is_admin());
 drop policy if exists "ads admin update" on storage.objects;
 create policy "ads admin update" on storage.objects for update to authenticated using (bucket_id='ads' and public.is_admin()) with check (bucket_id='ads' and public.is_admin());
 drop policy if exists "ads admin delete" on storage.objects;
 create policy "ads admin delete" on storage.objects for delete to authenticated using (bucket_id='ads' and public.is_admin());
exception when others then
 raise notice 'ছবি আপলোডের অংশ বসেনি (%): ঠিক আছে, ছবির লিংক বসিয়ে এড চালানো যাবে।', sqlerrm;
end $$;
