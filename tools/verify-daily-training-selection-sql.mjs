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
    create schema auth; create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
  for (const file of ['202610040001_foundation.sql','202610130001_daily_activities.sql','202610140002_routine_checklists.sql','202610150001_routine_repeat_weekdays.sql','202610180001_multi_dog_profiles.sql','202610220001_daily_routine_checklist_icons.sql','202610240001_training_progression.sql','202610300001_routine_checklist_validation_fix.sql']) {
    await db.exec(await read(`supabase/migrations/${file}`));
  }
  const probe = await read('supabase/tests/daily-active-training-selection.sql');
  await db.exec(probe.slice(0, probe.indexOf('-- Admission assertions')));
  await assert.rejects(db.exec(`insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
    values('95500000-0000-4000-8000-000000000001','95200000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000001','95400000-0000-4000-8000-000000000002',current_date,'UTC')`),
  (error) => error.code === '22023' && error.message.includes('next incomplete'));
  await db.exec('rollback');
  const migration = await read('supabase/migrations/202610300002_daily_active_training_selection.sql');
  await db.exec(migration);
  await db.exec(migration);
  await db.exec(probe);
  console.log(JSON.stringify({ result:'PASS', version:(await db.query('select version() as version')).rows[0].version,
    baseline:'Actual INSERT rejected current journey step 2 while legacy first was 1',
    repaired:'Active/maintenance step accepted; legacy fallback, exact replay, paused/stale/withdrawn/date/timezone/version/dog/owner denials and unchanged progression verified',
    scope:'Synthetic PostgreSQL, not live Supabase' },null,2));
} catch (error) { console.error(JSON.stringify({ result: 'FAIL', code: error.code, message: error.message, where: error.where })); process.exitCode = 1; } finally { await db.close(); }
