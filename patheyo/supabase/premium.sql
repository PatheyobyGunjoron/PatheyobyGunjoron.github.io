-- Patheyo — প্রিমিয়াম সদস্যের হিসাব (অ্যাডমিন প্যানেলের "প্রিমিয়াম" ট্যাব)
-- কীভাবে চালাবেন: Supabase → SQL Editor → New query → এই পুরো লেখা পেস্ট করে Run। বারবার চালালেও ক্ষতি নেই।
-- আগে schema.sql চালানো থাকতে হবে (is_admin() সেখানে তৈরি হয়)।
--
-- গোপনীয়তা: এখানে কোনো নাম, ইমেইল, ফোন নম্বর বা Firebase uid রাখা হয় না।
--   সদস্যকে চেনা হয় শুধু বেনামী "সদস্য কোড" দিয়ে (PM-XXXX-XXXX = SHA-256("patheyo-premium:"+uid)-এর প্রথম ৮ অক্ষর)।
--   ডেটা আসে premium-admin Edge Function-এর "সিঙ্ক" থেকে (Firebase-এর orders ও users/*/premium পড়ে শুধু প্ল্যান, মেয়াদ ও টাকার অঙ্ক রাখে)।
--   টেবিলে সরাসরি লেখার অনুমতি কারও নেই — শুধু Edge Function (service_role)।

create table if not exists premium_members(
  member_code text primary key,
  plan text not null check (plan in ('monthly','yearly','lifetime')),
  since timestamptz,
  until timestamptz,                 -- আজীবনে null
  source text,                       -- sslcommerz / bkash / shurjopay / play / manual
  synced_at timestamptz not null default now()
);

create table if not exists premium_payments(
  order_id text primary key,
  member_code text not null,
  plan text not null,
  amount numeric(12,2) not null default 0,
  gateway text,
  method text,                       -- bKash / Nagad / VISA ইত্যাদি (গেটওয়ে যা জানায়)
  paid_at timestamptz not null,
  estimated boolean not null default false   -- Google Play: আসল অঙ্ক Play কনসোলে; এখানে প্ল্যানের দাম ধরে আনুমানিক
);
create index if not exists premium_payments_paid on premium_payments(paid_at);
create index if not exists premium_payments_member on premium_payments(member_code);

create table if not exists premium_meta(k text primary key, v jsonb, updated_at timestamptz not null default now());

alter table premium_members enable row level security;
alter table premium_payments enable row level security;
alter table premium_meta enable row level security;
drop policy if exists "admin read premium members" on premium_members;
create policy "admin read premium members" on premium_members for select using (is_admin());
drop policy if exists "admin read premium payments" on premium_payments;
create policy "admin read premium payments" on premium_payments for select using (is_admin());
drop policy if exists "admin read premium meta" on premium_meta;
create policy "admin read premium meta" on premium_meta for select using (is_admin());

-- notifications টেবিলে প্রিমিয়াম পাঠানোর ধরনও রাখা যায়
alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications add constraint notifications_kind_check check (kind in ('announcement','app_update','premium'));

-- এক কলে পুরো সারসংক্ষেপ (বাংলাদেশ সময় ধরে দিন/মাস)
create or replace function admin_premium_summary() returns json
language plpgsql security definer stable set search_path = public as $$
declare
  tz text := 'Asia/Dhaka';
  n timestamptz := now();
  m0 timestamptz := date_trunc('month', now() at time zone tz) at time zone tz;
  d0 timestamptz := date_trunc('day', now() at time zone tz) at time zone tz;
  r json;
begin
  if not is_admin() then return null; end if;
  with mem as (
    select *, (plan = 'lifetime' or until > n) as active from premium_members
  ), pay as (select * from premium_payments)
  select json_build_object(
    'active',         (select count(*) from mem where active),
    'monthly',        (select count(*) from mem where active and plan = 'monthly'),
    'yearly',         (select count(*) from mem where active and plan = 'yearly'),
    'lifetime',       (select count(*) from mem where plan = 'lifetime'),
    'expiring7',      (select count(*) from mem where active and plan <> 'lifetime' and until <= n + interval '7 days'),
    'expiring30',     (select count(*) from mem where active and plan <> 'lifetime' and until <= n + interval '30 days'),
    'expired',        (select count(*) from mem where not active),
    'expired30',      (select count(*) from mem where not active and until > n - interval '30 days'),
    'members_all',    (select count(*) from mem),
    'new_month',      (select count(*) from mem where since >= m0),
    'rev_total',      (select coalesce(sum(amount),0) from pay),
    'rev_today',      (select coalesce(sum(amount),0) from pay where paid_at >= d0),
    'rev_month',      (select coalesce(sum(amount),0) from pay where paid_at >= m0),
    'rev_prev_month', (select coalesce(sum(amount),0) from pay where paid_at >= m0 - interval '1 month' and paid_at < m0),
    'rev_30d',        (select coalesce(sum(amount),0) from pay where paid_at >= n - interval '30 days'),
    'pay_count',      (select count(*) from pay),
    'pay_month',      (select count(*) from pay where paid_at >= m0),
    'renewals',       (select count(*) - count(distinct member_code) from pay),
    'estimated_part', (select coalesce(sum(amount),0) from pay where estimated),
    'by_plan',        (select coalesce(json_agg(x order by x.amount desc),'[]') from (select plan, count(*) n, sum(amount) amount from pay group by plan) x),
    'by_gateway',     (select coalesce(json_agg(x order by x.amount desc),'[]') from (select coalesce(nullif(method,''), gateway, '—') as name, count(*) n, sum(amount) amount from pay group by 1) x),
    'monthly_series', (select json_agg(json_build_object('month', to_char(g, 'YYYY-MM'),
                         'amount', (select coalesce(sum(amount),0) from pay where paid_at >= (g at time zone tz) and paid_at < ((g + interval '1 month') at time zone tz)),
                         'count',  (select count(*) from pay where paid_at >= (g at time zone tz) and paid_at < ((g + interval '1 month') at time zone tz)))
                         order by g)
                       from generate_series(date_trunc('month', now() at time zone tz) - interval '11 months', date_trunc('month', now() at time zone tz), interval '1 month') g),
    'last_sync',      (select v from premium_meta where k = 'sync')
  ) into r;
  return r;
end $$;
revoke all on function admin_premium_summary() from public;
grant execute on function admin_premium_summary() to authenticated;
