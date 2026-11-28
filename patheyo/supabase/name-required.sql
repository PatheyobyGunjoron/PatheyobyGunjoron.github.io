-- Patheyo — যোগাযোগ/মতামত ফর্মে নাম বাধ্যতামূলক
-- Supabase → SQL Editor → New query → পুরোটা পেস্ট করে Run। বারবার Run করলেও ক্ষতি নেই।
-- নাম না দিলে (বা শুধু সংখ্যা/চিহ্ন দিলে) বার্তা জমা হবে না — ওয়েবসাইট তখন "আপনার নাম লিখুন" দেখায়।
-- আগের সব বার্তা ও রিভিউ যেমন আছে তেমনই থাকবে।

create or replace function submit_contact(p jsonb) returns json language plpgsql security definer set search_path=public as $$
declare k text:=coalesce(p->>'kind','message'); msg text:=btrim(coalesce(p->>'message','')); r smallint; ip text; rec contact_messages;
begin
 if k not in('message','feedback','bug','feature','content','deletion') then k:='message'; end if;
 if length(msg)<3 then raise exception 'message_too_short'; end if;
 -- নাম বাধ্যতামূলক: অন্তত ২ অক্ষর, আর শুধু সংখ্যা/চিহ্ন দিয়ে নাম হবে না (বাংলা নাম ঠিকই চলে)
 if length(btrim(coalesce(p->>'name','')))<2 or btrim(coalesce(p->>'name','')) ~ '^[[:space:][:digit:][:punct:]০-৯]+$' then raise exception 'name_required'; end if;
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

grant execute on function submit_contact(jsonb) to anon,authenticated;
