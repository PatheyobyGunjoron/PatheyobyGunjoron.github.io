-- Patheyo — push_tokens (ডিভাইস টোকেন নিবন্ধন) — send-push ফাংশনের "ডাইরেক্ট কপি"-র জন্য
-- কীভাবে চালাবেন: Supabase → SQL Editor → New query → এই পুরো লেখা পেস্ট করে Run।
-- বারবার চালালেও কোনো ক্ষতি নেই (idempotent) — আগে থেকে থাকলে শুধু ঠিক করে দেয়।
--
-- কেন লাগে: অ্যাপ চালু হলে নিজের FCM টোকেন register_push_token() দিয়ে এখানে জমা দেয়।
-- send-push প্রতিটি নোটিফিকেশন (ক) টপিকে এবং (খ) এই টেবিলের প্রতিটি টোকেনে পাঠায়।
-- টেবিল/ফাংশন না থাকলে (খ) নিঃশব্দে ব্যর্থ হয় — শুধু টপিকের ওপর নির্ভর করতে হয় (ধীর/অনির্ভরযোগ্য হতে পারে)।

create table if not exists push_tokens(
  token text primary key,
  installation_id text,
  version text,
  updated_at timestamptz not null default now()
);
alter table push_tokens add column if not exists installation_id text;
alter table push_tokens add column if not exists version text;
alter table push_tokens add column if not exists updated_at timestamptz not null default now();
create index if not exists push_tokens_version on push_tokens(version);
create index if not exists push_tokens_installation on push_tokens(installation_id);

-- সরাসরি টেবিলে লেখা/পড়া নিষিদ্ধ; শুধু নিচের ফাংশন (ও service_role, যা send-push ব্যবহার করে)
alter table push_tokens enable row level security;

-- একই ফোনের (installation_id) পুরনো টোকেন মুছে নতুনটা বসায়, তাই একই ফোনে দুইবার নোটিফিকেশন যায় না
drop function if exists register_push_token(text, text, text);
create function register_push_token(p_installation text, p_token text, p_version text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_token is null or length(p_token) < 20 or length(p_token) > 4096 then return; end if;
  if p_installation is not null and length(p_installation) between 8 and 64 then
    delete from push_tokens where installation_id = p_installation and token <> p_token;
  end if;
  insert into push_tokens(token, installation_id, version, updated_at)
  values (p_token, nullif(left(p_installation, 64), ''), nullif(left(p_version, 32), ''), now())
  on conflict (token) do update
    set installation_id = excluded.installation_id, version = excluded.version, updated_at = now();
end $$;
revoke all on function register_push_token(text, text, text) from public;
grant execute on function register_push_token(text, text, text) to anon, authenticated;
