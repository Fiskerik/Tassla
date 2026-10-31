-- Run after 202610300001 in a development database as postgres. Synthetic data rolls back.
begin;

do $$
declare
  v_valid jsonb := '[{"id":"93000000-0000-4000-8000-000000000001","label":"Mat","icon":"restaurant-outline"}]';
  v_invalid jsonb;
  v_limit jsonb;
begin
  if not private.valid_daily_routine_checklist(v_valid)
    or not private.valid_daily_routine_checklist(v_valid #- '{0,icon}') then raise exception 'Valid checklist rejected'; end if;
  foreach v_invalid in array array[
    'null'::jsonb, '{}'::jsonb, '[]'::jsonb, '[null]'::jsonb, '[1]'::jsonb, '[[]]'::jsonb,
    '["item"]'::jsonb, '[true]'::jsonb,
    jsonb_set(v_valid,'{0,id}','null'), jsonb_set(v_valid,'{0,label}','null'),
    jsonb_set(v_valid,'{0,id}','"not-a-uuid"'), jsonb_set(v_valid,'{0,label}','" Mat"'),
    jsonb_set(v_valid,'{0,label}','""'), jsonb_set(v_valid,'{0,icon}','null'),
    jsonb_set(v_valid,'{0,icon}','42'), jsonb_set(v_valid,'{0,icon}','"unknown"'),
    jsonb_set(v_valid,'{0,extra}','"not allowed"'),
    jsonb_set(v_valid #- '{0,icon}','{0,extra}','"not allowed"'),
    v_valid #- '{0,id}', v_valid #- '{0,label}', v_valid || v_valid,
    jsonb_set(v_valid,'{0,label}',to_jsonb(repeat('x',161)))
  ] loop
    if private.valid_daily_routine_checklist(v_invalid) then raise exception 'Invalid checklist accepted: %',v_invalid; end if;
  end loop;
  if private.valid_daily_routine_checklist(null) then raise exception 'SQL null accepted'; end if;
  select jsonb_agg(jsonb_build_object('id','93000000-0000-4000-8000-'||lpad(i::text,12,'0'),'label',repeat('x',160)))
    into v_limit from generate_series(1,50) i;
  if not private.valid_daily_routine_checklist(v_limit) then raise exception '50 items / 160 chars rejected'; end if;
  if private.valid_daily_routine_checklist(v_limit || jsonb_build_array(jsonb_build_object('id','93000000-0000-4000-8000-000000000051','label','Extra')))
    then raise exception '51 items accepted'; end if;
  if has_function_privilege('anon','private.valid_daily_routine_checklist(jsonb)','EXECUTE')
    or has_function_privilege('authenticated','private.valid_daily_routine_checklist(jsonb)','EXECUTE')
    or exists(select 1 from pg_proc p, lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
      where p.oid='private.valid_daily_routine_checklist(jsonb)'::regprocedure and a.grantee=0 and a.privilege_type='EXECUTE')
    then raise exception 'Validator ACL widened'; end if;
  if not exists(select 1 from pg_proc p where p.oid='private.valid_daily_routine_checklist(jsonb)'::regprocedure
    and p.provolatile='i' and not p.prosecdef and p.proconfig @> array['search_path=""'])
    then raise exception 'Validator execution settings changed'; end if;
end $$;

insert into auth.users(id,email) values
 ('93100000-0000-4000-8000-000000000001','routine-a@example.invalid'),
 ('93100000-0000-4000-8000-000000000002','routine-b@example.invalid');
insert into public.breeds(id,name) values('routine-repair-probe','Routine repair probe');
insert into public.dogs(id,name,breed_id,birth_date) values
 ('93200000-0000-4000-8000-000000000001','A','routine-repair-probe','2026-01-01'),
 ('93200000-0000-4000-8000-000000000002','B','routine-repair-probe','2026-01-01');
insert into public.dog_memberships(dog_id,user_id) values
 ('93200000-0000-4000-8000-000000000001','93100000-0000-4000-8000-000000000001'),
 ('93200000-0000-4000-8000-000000000002','93100000-0000-4000-8000-000000000002');

set local role authenticated;
set local request.jwt.claim.sub='93100000-0000-4000-8000-000000000001';
do $$
declare
 v_row public.dog_daily_routines;
 v_anchor date;
 v_count integer;
 v_checklist jsonb := '[{"id":"93300000-0000-4000-8000-000000000001","label":"Mat","icon":"restaurant-outline"},{"id":"93300000-0000-4000-8000-000000000002","label":"Vatten","icon":"water-outline"}]';
begin
 v_row := public.create_daily_routine_v2('93200000-0000-4000-8000-000000000001','93400000-0000-4000-8000-000000000001',' Morgon ',v_checklist,'day',1,null,'Europe/Stockholm');
 if v_row.label<>'Morgon' or v_row.checklist<>v_checklist or v_row.checklist_revision<>1 or v_row.repeat_anchor_date is null then raise exception 'Create failed'; end if;
 v_anchor:=v_row.repeat_anchor_date;
 v_row := public.create_daily_routine_v2(v_row.dog_id,v_row.id,'Morgon',v_checklist,'day',1,null,'Europe/Stockholm');
 if v_row.checklist_revision<>1 then raise exception 'Retry changed revision'; end if;
 v_row := public.replace_daily_routine_v2(v_row.dog_id,v_row.id,1,'Morgon igen',v_checklist,'day',1,null,'Europe/Stockholm');
 if v_row.checklist_revision<>2 or v_row.label<>'Morgon igen' or v_row.repeat_anchor_date<>v_anchor then raise exception 'Replace lost revision/anchor'; end if;
 v_row := public.create_daily_routine_v2(v_row.dog_id,'93400000-0000-4000-8000-000000000002','Vecka',v_checklist,'week',2,array[1,3]::smallint[],'Europe/Stockholm');
 if v_row.repeat_unit<>'week' or v_row.repeat_weekdays<>array[1,3]::smallint[] then raise exception 'Weekday rule lost'; end if;
 v_row := public.create_daily_routine_v2(v_row.dog_id,'93400000-0000-4000-8000-000000000003','Månad',v_checklist,'month',1,null,'Europe/Stockholm');
 if v_row.repeat_unit<>'month' or v_row.repeat_anchor_date is null then raise exception 'Monthly rule lost'; end if;
 v_row := public.create_daily_routine_v2(v_row.dog_id,'93400000-0000-4000-8000-000000000004','En gång',v_checklist,null,null,null,'Europe/Stockholm');
 if v_row.repeat_anchor_date is not null then raise exception 'One-off acquired anchor'; end if;
 select count(*) into v_count from public.dog_daily_routines;
 begin
   perform public.create_daily_routine_v2(v_row.dog_id,'93400000-0000-4000-8000-000000000005','Ogiltig','[null]',null,null,null,'Europe/Stockholm');
   raise exception 'Invalid write accepted';
 exception when invalid_parameter_value then null;
 end;
 if (select count(*) from public.dog_daily_routines)<>v_count then raise exception 'Rejected write changed rows'; end if;
end $$;

set local request.jwt.claim.sub='93100000-0000-4000-8000-000000000002';
do $$ begin
 if exists(select 1 from public.dog_daily_routines) then raise exception 'Other owner read routines'; end if;
 begin
  perform public.create_daily_routine_v2('93200000-0000-4000-8000-000000000001','93400000-0000-4000-8000-000000000006','Forbidden','[]',null,null,null,'UTC');
  raise exception 'Other owner created routine';
 exception when insufficient_privilege then null; end;
 begin
  perform public.replace_daily_routine_v2('93200000-0000-4000-8000-000000000001','93400000-0000-4000-8000-000000000001',2,'Forbidden','[]',null,null,null,'UTC');
  raise exception 'Other owner replaced routine';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 if (select count(*) from public.dog_daily_routines where dog_id='93200000-0000-4000-8000-000000000001')<>4
  or (select label from public.dog_daily_routines where id='93400000-0000-4000-8000-000000000001')<>'Morgon igen'
  then raise exception 'Denied writes changed data'; end if;
end $$;
rollback;
