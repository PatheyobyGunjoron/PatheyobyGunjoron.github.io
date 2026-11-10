-- Patheyo — যোগাযোগ, মতামত ও সমস্যা জানানোর ইনবক্স  |  Supabase → SQL Editor-এ পুরোটা একবার Run করুন।
-- বারবার Run করলেও ক্ষতি নেই (idempotent)। আগে schema.sql চালানো থাকতে হবে (is_admin() সেখানে তৈরি হয়)।
--
-- যা পাবেন:
--   • ওয়েবসাইটের /patheyo/contact/ পেজ (অ্যাপ থেকেও খোলা যায়) থেকে বার্তা সরাসরি এই টেবিলে আসে
--   • অ্যাডমিন প্যানেলের "বার্তা" ট্যাবে সব বার্তা দেখা, উত্তর লেখা, অবস্থা বদলানো, মুছে ফেলা
--   • আপনার উত্তর ব্যবহারকারী ওয়েবসাইটের যোগাযোগ পেজেই দেখতে পান (তাঁর ফোন/ব্রাউজারে রাখা গোপন টিকিট দিয়ে)
--   • অনুমতি দেওয়া মতামত আপনি "ওয়েবসাইটে দেখান" চালু করলে হোমপেজের "ব্যবহারকারীরা যা বলছেন" অংশে আসে
-- নিরাপত্তা: সাধারণ মানুষ টেবিল সরাসরি পড়তে/লিখতে পারে না; শুধু নিচের যাচাইকৃত ফাংশন দিয়ে বার্তা জমা দেয়।

create table if not exists contact_messages(
 id bigserial primary key,
 token uuid not null default gen_random_uuid(),                 -- ব্যবহারকারীর গোপন টিকিট (উত্তর দেখার জন্য)
 kind text not null default 'message' check(kind in('message','feedback','bug','feature','content','deletion')),
 name text check(name is null or length(name)<=80),
 contact text check(contact is null or length(contact)<=120),   -- ইমেইল বা ফোন (ঐচ্ছিক)
 subject text check(subject is null or length(subject)<=150),
 message text not null check(length(message) between 3 and 4000),
 rating smallint check(rating is null or rating between 1 and 5),
 allow_public boolean not null default false,                   -- ব্যবহারকারী অনুমতি দিয়েছেন কি না
 is_public boolean not null default false,                      -- অ্যাডমিন ওয়েবসাইটে দেখাচ্ছেন কি না
 source text not null default 'web' check(source in('web','app')),
 app_version text check(app_version is null or length(app_version)<=32),
 device text check(device is null or length(device)<=80),
 android text check(android is null or length(android)<=16),
 installation_id text check(installation_id is null or length(installation_id)<=64),
 feature text check(feature is null or length(feature)<=60),    -- সমস্যা/প্রস্তাব কোন অংশে
 page text check(page is null or length(page)<=300),
 user_agent text check(user_agent is null or length(user_agent)<=400),
 ip_hash text,
 status text not null default 'new' check(status in('new','read','replied','closed','spam')),
 starred boolean not null default false,
 admin_note text check(admin_note is null or length(admin_note)<=2000),
 reply text check(reply is null or length(reply)<=4000),
 replied_at timestamptz, replied_by text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now());
create unique index if not exists contact_messages_token on contact_messages(token);
create index if not exists contact_messages_status_time on contact_messages(status,created_at desc);
create index if not exists contact_messages_kind on contact_messages(kind);
create index if not exists contact_messages_ip on contact_messages(ip_hash,created_at);

create or replace function contact_touch() returns trigger language plpgsql as $$
begin new.updated_at=now();
 if new.reply is distinct from old.reply and coalesce(new.reply,'')<>'' then new.replied_at=now(); if new.status in('new','read') then new.status='replied'; end if; end if;
 return new; end$$;
drop trigger if exists t_contact_touch on contact_messages;
create trigger t_contact_touch before update on contact_messages for each row execute function contact_touch();

alter table contact_messages enable row level security;
drop policy if exists "admin all messages" on contact_messages;
create policy "admin all messages" on contact_messages for all using(is_admin()) with check(is_admin());

-- ===== পাবলিক: বার্তা জমা =====
-- p: {"kind","name","contact","subject","message","rating","allow_public","source","app_version","device","android","installation_id","feature","page","user_agent"}
create or replace function submit_contact(p jsonb) returns json language plpgsql security definer set search_path=public as $$
declare k text:=coalesce(p->>'kind','message'); msg text:=btrim(coalesce(p->>'message','')); r smallint; ip text; rec contact_messages;
begin
 if k not in('message','feedback','bug','feature','content','deletion') then k:='message'; end if;
 if length(msg)<3 then raise exception 'message_too_short'; end if;
 if length(msg)>4000 then msg:=left(msg,4000); end if;
 r:=case when (p->>'rating') ~ '^[1-5]$' then (p->>'rating')::smallint end;
 -- স্প্যাম রোধ: একই নেটওয়ার্ক থেকে ১০ মিনিটে সর্বোচ্চ ৫টি, আর সারা সাইটে মিনিটে সর্বোচ্চ ৪০টি
 begin ip:=md5(coalesce(split_part(current_setting('request.headers',true)::json->>'x-forwarded-for',',',1),'')||'patheyo'); exception when others then ip:=null; end;
 if ip is not null and (select count(*) from contact_messages where ip_hash=ip and created_at>now()-interval '10 minutes')>=5 then raise exception 'rate_limited'; end if;
 if (select count(*) from contact_messages where created_at>now()-interval '1 minute')>=40 then raise exception 'rate_limited'; end if;
 insert into contact_messages(kind,name,contact,subject,message,rating,allow_public,source,app_version,device,android,installation_id,feature,page,user_agent,ip_hash)
 values(k,nullif(left(btrim(coalesce(p->>'name','')),80),''),nullif(left(btrim(coalesce(p->>'contact','')),120),''),nullif(left(btrim(coalesce(p->>'subject','')),150),''),
  msg,case when k='feedback' then r end,coalesce(p->>'allow_public','')='true' and k='feedback',
  case when p->>'source'='app' then 'app' else 'web' end,nullif(left(p->>'app_version',32),''),nullif(left(p->>'device',80),''),nullif(left(p->>'android',16),''),
  nullif(left(p->>'installation_id',64),''),nullif(left(p->>'feature',60),''),nullif(left(p->>'page',300),''),nullif(left(p->>'user_agent',400),''),ip)
 returning * into rec;
 return json_build_object('id',rec.id,'token',rec.token,'created_at',rec.created_at);
end$$;

-- ===== পাবলিক: নিজের পাঠানো বার্তার অবস্থা ও উত্তর (শুধু যাঁর কাছে টিকিট আছে) =====
create or replace function my_messages(p_tokens uuid[]) returns table(id bigint,token uuid,kind text,subject text,message text,status text,reply text,replied_at timestamptz,created_at timestamptz)
language sql security definer stable set search_path=public as $$
 select m.id,m.token,m.kind,m.subject,left(m.message,300),case when m.status='spam' then 'closed' else m.status end,m.reply,m.replied_at,m.created_at
 from contact_messages m where m.token = any(coalesce(p_tokens[1:30],'{}')) order by m.created_at desc$$;

-- ===== পাবলিক: ওয়েবসাইটে দেখানোর অনুমোদিত মতামত =====
create or replace function public_reviews(p_limit int default 12) returns json language sql security definer stable set search_path=public as $$
 select json_build_object(
  'reviews',coalesce((select json_agg(x) from (select split_part(coalesce(name,'একজন ব্যবহারকারী'),' ',1) as name,rating,message,app_version,created_at
     from contact_messages where kind='feedback' and is_public and allow_public and status<>'spam' order by created_at desc limit least(greatest(coalesce(p_limit,12),1),30)) x),'[]'::json),
  'count',(select count(*) from contact_messages where kind='feedback' and rating is not null and status<>'spam'),
  'avg',(select round(avg(rating)::numeric,1) from contact_messages where kind='feedback' and rating is not null and status<>'spam'))$$;

-- ===== অ্যাডমিন: সারসংক্ষেপ =====
create or replace function admin_inbox_stats() returns json language plpgsql security definer stable set search_path=public as $$
begin if not is_admin() then return null; end if;
 return json_build_object(
  'total',(select count(*) from contact_messages where status<>'spam'),
  'new',(select count(*) from contact_messages where status='new'),
  'today',(select count(*) from contact_messages where created_at>=date_trunc('day',now())),
  'replied',(select count(*) from contact_messages where status='replied'),
  'avg_rating',(select round(avg(rating)::numeric,1) from contact_messages where rating is not null and status<>'spam'),
  'ratings',(select count(*) from contact_messages where rating is not null and status<>'spam'),
  'by_kind',(select coalesce(json_object_agg(kind,n),'{}'::json) from (select kind,count(*) n from contact_messages where status<>'spam' group by kind) x));
end$$;

grant execute on function submit_contact(jsonb),my_messages(uuid[]),public_reviews(int) to anon,authenticated;
grant execute on function admin_inbox_stats() to authenticated;
revoke execute on function admin_inbox_stats() from anon;
