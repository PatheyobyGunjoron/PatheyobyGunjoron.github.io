-- Patheyo — ওয়েবসাইটের রিভিউ (v2)  |  Supabase → SQL Editor → New query → পুরোটা পেস্ট করে Run।
-- বারবার Run করলেও ক্ষতি নেই। (messages.sql আগে চালানো থাকতে হবে — সেটা আগেই চালানো আছে)
--
-- যা বদলায়:
--   • অ্যাডমিন প্যানেলে যেকোনো বার্তায় (মতামত, সাধারণ বার্তা ইত্যাদি) "ওয়েবসাইটে রিভিউ হিসেবে দেখান" চালু করলেই
--     সেটা হোমপেজের "ব্যবহারকারীরা যা বলছেন" অংশে আসে — ব্যবহারকারী অনুমতির ঘরে টিক দিন বা না দিন।
--   • রিভিউতে ব্যবহারকারীর পুরো নাম দেখায় (আগে শুধু নামের প্রথম শব্দ দেখাত)।
--   • স্প্যাম চিহ্নিত বার্তা কখনো দেখায় না। ফোন/ইমেইল/ডিভাইসের তথ্য কখনো বাইরে যায় না।

create or replace function public_reviews(p_limit int default 12) returns json language sql security definer stable set search_path=public as $$
 select json_build_object(
  'reviews',coalesce((select json_agg(x) from (
     select coalesce(nullif(btrim(name),''),'একজন ব্যবহারকারী') as name,
            rating, message, app_version, source, created_at
     from contact_messages
     where is_public and status<>'spam'
     order by starred desc, created_at desc
     limit least(greatest(coalesce(p_limit,12),1),30)) x),'[]'::json),
  'count',(select count(*) from contact_messages where rating is not null and status<>'spam'),
  'avg',(select round(avg(rating)::numeric,1) from contact_messages where rating is not null and status<>'spam'))$$;

grant execute on function public_reviews(int) to anon,authenticated;
