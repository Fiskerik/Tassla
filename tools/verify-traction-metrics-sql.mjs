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
  for (const file of ['202610040001_foundation.sql', '202610080001_beta_metrics.sql', '202610270003_traction_metrics.sql']) {
    await db.exec(await read(`supabase/migrations/${file}`));
  }
  const users = Array.from({ length: 6 }, randomUUID);
  for (const user of users) await db.query('insert into auth.users(id) values($1)', [user]);
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${users[0]}'`);
  let result = await db.query("select public.record_product_event('onboarding_opened') as id");
  if (result.rows[0].id !== null) throw new Error('Event accepted before consent');
  await db.query('select public.set_beta_metrics_consent(true)');
  result = await db.query("select public.record_product_event('referral_opened') as id");
  if (!result.rows[0].id) throw new Error('Consented referral event rejected');
  let denied = false;
  try { await db.query("select * from public.beta_traction_report(current_date - 12,current_date - 12)"); } catch { denied = true; }
  if (!denied) throw new Error('Authenticated user can read aggregate report');
  await db.exec('reset role');
  await db.query('delete from public.product_events');
  for (const user of users) {
    await db.query('insert into public.beta_metrics_consents(user_id,enabled) values($1,true) on conflict(user_id) do update set enabled=true', [user]);
    for (const [type, offset] of [['onboarding_opened',0],['referral_opened',0.01],['dog_created',0.02],['home_viewed',0.03],['first_log',0.04],['home_viewed',1.5],['home_viewed',7.5]]) {
      await db.query(`insert into public.product_events(id,user_id,event_type,occurred_at)
        values($1,$2,$3,((now() at time zone 'UTC')::date - 12 + time '09:00') at time zone 'UTC' + $4::double precision * interval '1 day')`, [randomUUID(), user, type, offset]);
    }
  }
  await db.exec('set role service_role');
  const report = () => db.query("select * from public.beta_traction_report((now() at time zone 'UTC')::date-12,(now() at time zone 'UTC')::date-12)");
  result = await report();
  for (const [key, value] of Object.entries(result.rows[0])) if (Number(value) !== 6) throw new Error(`Unexpected ${key} aggregate: ${value}`);
  await db.exec('reset role');
  await db.query("update public.product_events set occurred_at = occurred_at - interval '1 day' where user_id=$1 and event_type='dog_created'", [users[0]]);
  await db.query("delete from public.product_events where user_id=$1 and event_type='first_log'", [users[1]]);
  await db.exec('set role service_role');
  result = await report();
  if (Number(result.rows[0].dog_created) !== 5 || Number(result.rows[0].home_viewed) !== 5 || result.rows[0].first_value !== null) {
    throw new Error('Funnel ignored event order or failed to suppress a small stage');
  }
  await db.exec('reset role');
  await db.query("update public.product_events set occurred_at = occurred_at + interval '1 day' where user_id=$1 and event_type='dog_created'", [users[0]]);
  await db.query(`insert into public.product_events(id,user_id,event_type,occurred_at)
    values($1,$2,'first_log',((now() at time zone 'UTC')::date - 12 + time '10:00') at time zone 'UTC')`, [randomUUID(), users[1]]);
  await db.exec('set role service_role');
  let rejected = false;
  try { await db.query("select * from public.beta_traction_report((now() at time zone 'UTC')::date-1,(now() at time zone 'UTC')::date-1)"); } catch { rejected = true; }
  if (!rejected) throw new Error('Immature D7 cohort accepted');
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${users[0]}'`);
  await db.query('select public.set_beta_metrics_consent(false)');
  await db.exec('set role service_role');
  result = await report();
  if (Number(result.rows[0].cohort_size) !== 5) throw new Error('Withdrawn owner remains in report');
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${users[1]}'`);
  await db.query('select public.set_beta_metrics_consent(false)');
  await db.exec('set role service_role');
  result = await report();
  if (Object.values(result.rows[0]).some((value) => value !== null)) throw new Error('Small cohort was not suppressed');
  console.log('PASS: consent, restricted aggregate report, mature D1/D7 windows, withdrawal and small-cohort suppression');
} finally { await db.close(); }
