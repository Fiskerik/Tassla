import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';

const root = process.env.TASSLA_SQL_TOOLS ?? '/tmp/tassla-sql-tools';
const { PGlite } = await import(pathToFileURL(path.join(root, 'node_modules/@electric-sql/pglite/dist/index.js')).href);
const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const db = new PGlite();
try {
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;`);
  for (const file of ['202610040001_foundation.sql', '202610140001_accident_kinds.sql', '202610220002_dog_event_insights_read.sql', '202610270004_insights_today.sql']) {
    await db.exec(await read(`supabase/migrations/${file}`));
  }
  const owner=randomUUID(), other=randomUUID(), dog=randomUUID(), otherDog=randomUUID();
  await db.query('insert into auth.users(id) values($1),($2)', [owner,other]);
  await db.exec("insert into public.breeds(id,name) values('fixture','Fixture')");
  await db.query("insert into public.dogs(id,name,breed_id,birth_date) values($1,'A','fixture','2026-01-01'),($2,'B','fixture','2026-01-01')", [dog,otherDog]);
  await db.query('insert into public.dog_memberships(dog_id,user_id) values($1,$2),($3,$4)', [dog,owner,otherDog,other]);
  await db.query("insert into public.dog_events(id,dog_id,actor_id,event_type,occurred_at) values($1,$2,$3,'pee',now()),($4,$2,$3,'pee',now()+interval '1 day'),($5,$6,$7,'pee',now())", [randomUUID(),dog,owner,randomUUID(),randomUUID(),otherDog,other]);
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${owner}'`);
  for (const timezone of ['UTC','Europe/Stockholm']) {
    const result=(await db.query("select public.dog_event_insights($1,'today',$2) as value",[dog,timezone])).rows[0].value;
    if (result.period!=='today' || result.days.length!==1 || result.days[0].peeCount!==1 || result.periodStartLocal!==result.observedThroughLocal) throw new Error(`Incorrect today result: ${JSON.stringify(result)}`);
  }
  for (const period of ['week','month','since_first_log']) {
    const result=(await db.query('select public.dog_event_insights($1,$2,$3) as value',[dog,period,'UTC'])).rows[0].value;
    if (result.period!==period || !result.days.length) throw new Error(`Existing period failed: ${period}`);
  }
  let rejected=false;
  try { await db.query("select public.dog_event_insights($1,'today','UTC')",[otherDog]); } catch { rejected=true; }
  if (!rejected) throw new Error('Other owner could read today insights');
  console.log('PASS: today UTC/Stockholm, actual event and future exclusion, existing periods and owner isolation');
} finally { await db.close(); }
