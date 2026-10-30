import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.env.TASSLA_SQL_TOOLS ?? '/tmp/tassla-sql-tools';
const { PGlite } = await import(pathToFileURL(path.join(root, 'node_modules/@electric-sql/pglite/dist/index.js')).href);
const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const db = new PGlite();
try {
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin;
    create schema auth; create table auth.users(id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;`);
  for (const file of ['202610040001_foundation.sql', '202610130001_daily_activities.sql', '202610140002_routine_checklists.sql', '202610150001_routine_repeat_weekdays.sql', '202610220001_daily_routine_checklist_icons.sql']) {
    await db.exec(await read(`supabase/migrations/${file}`));
  }
  const version = (await db.query('select version() as version')).rows[0].version;
  await db.exec(`begin;
    insert into auth.users(id) values('94000000-0000-4000-8000-000000000001');
    insert into public.breeds(id,name) values('routine-baseline','Synthetic baseline');
    insert into public.dogs(id,name,breed_id,birth_date) values('94000000-0000-4000-8000-000000000002','Baseline','routine-baseline','2026-01-01');
    insert into public.dog_memberships(dog_id,user_id) values('94000000-0000-4000-8000-000000000002','94000000-0000-4000-8000-000000000001');
    set local role authenticated; set local request.jwt.claim.sub='94000000-0000-4000-8000-000000000001';`);
  await assert.rejects(db.query(`select public.create_daily_routine_v2(
    '94000000-0000-4000-8000-000000000002','94000000-0000-4000-8000-000000000003','Morgon',
    '[{"id":"94000000-0000-4000-8000-000000000004","label":"Mat","icon":"restaurant-outline"}]'::jsonb,
    'day',1,null,'Europe/Stockholm')`), (error) => error.code === '42883' && error.message.includes('jsonb_object_length'));
  await db.exec('rollback');
  const migration = await read('supabase/migrations/202610300001_routine_checklist_validation_fix.sql');
  await db.exec(migration);
  await db.exec(migration);
  await db.exec(await read('supabase/tests/routine-checklist-validation.sql'));
  console.log(JSON.stringify({ result: 'PASS', version, baseline: 'Actual authenticated create_daily_routine_v2 failed with 42883 before repair', repaired: 'Validator boundaries, create/retry/replace/repeats, denied writes and owner isolation passed', migrationRetry: 'PASS', scope: 'Synthetic in-memory PostgreSQL; not live Supabase or native' }, null, 2));
} finally { await db.close(); }
