-- Patheyo — ওয়েবসাইটের ভিডিও (অ্যাডমিন প্যানেলের "ভিডিও" ট্যাব)
-- Supabase → SQL Editor → New query → পুরোটা পেস্ট করে Run।  বারবার Run করলেও ক্ষতি নেই (idempotent)।
-- আগে schema.sql চালানো থাকতে হবে (is_admin() সেখানে তৈরি হয় — সেটা আগেই চালানো আছে)।
--
-- যা পাবেন:
--   • অ্যাডমিন প্যানেল থেকে ভিডিওর লিংক (YouTube / GitHub রিলিজ / Google Drive / Facebook / Vimeo / যেকোনো .mp4 লিংক)
--     শিরোনাম, বিভাগ, বিবরণ, থাম্বনেইল আর কোনটা আগে দেখাবে — সব ঠিক করা যায়
--   • ওয়েবসাইটের "ভিডিও গাইড" অংশে সাথে সাথে দেখায় (কোড/ফাইল বদলাতে হয় না)
--   • কোন ভিডিও কতবার চালানো হয়েছে তার হিসাব
-- নিরাপত্তা: সাধারণ মানুষ শুধু চালু (প্রকাশিত) ভিডিওর তালিকা পড়তে পারে; যোগ/বদল/মোছা শুধু অ্যাডমিন।

create table if not exists site_videos(
 id uuid primary key default gen_random_uuid(),
 title text not null check(length(btrim(title)) between 1 and 150),
 category text not null default 'অ্যাপ পরিচিতি' check(length(category) between 1 and 60),
 description text check(description is null or length(description)<=600),
 video_url text not null check(video_url ~ '^https://' and length(video_url)<=1500),
 thumb_url text check(thumb_url is null or (thumb_url ~ '^https://' and length(thumb_url)<=1500)),
 duration text check(duration is null or length(duration)<=12),          -- যেমন "২:৩৫" (খালি রাখা যায়)
 is_active boolean not null default true,                                -- বন্ধ = ওয়েবসাইটে দেখাবে না (খসড়া)
 sort_order int not null default 100,                                    -- ছোট সংখ্যা আগে দেখায়
 views bigint not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now());
create index if not exists site_videos_order on site_videos(is_active, sort_order, created_at desc);

create or replace function site_videos_touch() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end$$;
drop trigger if exists t_site_videos_touch on site_videos;
create trigger t_site_videos_touch before update on site_videos for each row execute function site_videos_touch();

alter table site_videos enable row level security;
drop policy if exists "admin all videos" on site_videos;
create policy "admin all videos" on site_videos for all using(is_admin()) with check(is_admin());

-- ===== পাবলিক: ওয়েবসাইটে দেখানোর ভিডিও (শুধু চালু করাগুলো, ক্রম অনুযায়ী) =====
create or replace function public_videos() returns json language sql security definer stable set search_path=public as $$
 select coalesce(json_agg(x),'[]'::json) from (
   select id, title, category, description as "desc", video_url as src, thumb_url as poster, duration, created_at
   from site_videos where is_active
   order by sort_order, created_at desc limit 200) x$$;

-- ===== পাবলিক: ভিডিও চালানো হলে গোনা (একই ব্রাউজার থেকে বারবার গোনা ওয়েবসাইট নিজেই আটকায়) =====
create or replace function track_video_view(p_id uuid) returns void language sql security definer set search_path=public as $$
 update site_videos set views=views+1 where id=p_id and is_active$$;

grant execute on function public_videos(), track_video_view(uuid) to anon, authenticated;

-- ===== থাম্বনেইল ছবি আপলোডের জায়গা (প্যানেল থেকে সরাসরি ছবি আপলোড করতে) =====
do $$
begin
 insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('video-thumbs','video-thumbs',true,3145728,array['image/png','image/jpeg','image/webp'])
 on conflict (id) do update set public=true, file_size_limit=3145728, allowed_mime_types=array['image/png','image/jpeg','image/webp'];
 drop policy if exists "vthumb public read" on storage.objects;
 create policy "vthumb public read" on storage.objects for select using (bucket_id='video-thumbs');
 drop policy if exists "vthumb admin insert" on storage.objects;
 create policy "vthumb admin insert" on storage.objects for insert to authenticated with check (bucket_id='video-thumbs' and public.is_admin());
 drop policy if exists "vthumb admin update" on storage.objects;
 create policy "vthumb admin update" on storage.objects for update to authenticated using (bucket_id='video-thumbs' and public.is_admin()) with check (bucket_id='video-thumbs' and public.is_admin());
 drop policy if exists "vthumb admin delete" on storage.objects;
 create policy "vthumb admin delete" on storage.objects for delete to authenticated using (bucket_id='video-thumbs' and public.is_admin());
exception when others then
 raise notice 'স্টোরেজ সেটআপ বাদ গেল (%). থাম্বনেইলের লিংক বসিয়ে দিলেও সব কাজ করবে।', sqlerrm;
end $$;
