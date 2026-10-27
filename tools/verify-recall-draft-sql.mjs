import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const toolRoot = process.env.TASSLA_SQL_TOOLS ?? '/tmp/tassla-sql-tools';
const { PGlite } = await import(pathToFileURL(path.join(toolRoot, 'node_modules/@electric-sql/pglite/dist/index.js')).href);
const db = new PGlite();
const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const draft = JSON.parse(await read('docs/content/recall-program-v1.json'));
const sql = await read('supabase/content/recall-program-draft-v1.sql');

try {
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;`);
  await db.exec(await read('supabase/migrations/202610040001_foundation.sql'));
  await db.exec(await read('supabase/migrations/202610180002_content_ai_origin.sql'));
  await db.exec(sql);
  await db.exec(sql);
  const snapshot = await db.query(`select v.status, v.is_ai_generated,
    (select count(*)::int from public.training_steps s where s.program_version_id=v.id) as step_count
    from public.content_versions v where v.id=$1`, [draft.version_id]);
  if (snapshot.rows.length !== 1 || snapshot.rows[0].status !== 'draft' || snapshot.rows[0].is_ai_generated !== true || snapshot.rows[0].step_count !== 6) {
    throw new Error(`Unexpected imported draft: ${JSON.stringify(snapshot.rows)}`);
  }
  await db.exec('set role authenticated');
  const visible = await db.query('select count(*)::int as total from public.content_versions where id=$1', [draft.version_id]);
  const visibleItems = await db.query('select count(*)::int as total from public.content_items where id=$1', [draft.content_id]);
  const visibleSteps = await db.query('select count(*)::int as total from public.training_steps where program_version_id=$1', [draft.version_id]);
  await db.exec('reset role');
  if ([visible, visibleItems, visibleSteps].some(result => result.rows[0].total !== 0)) throw new Error('Draft became visible through the published-content RLS policy');

  await db.query('update public.content_versions set reviewed_at=now(), review_reference=$1 where id=$2', ['review recorded elsewhere', draft.version_id]);
  let reviewConflictRejected = false;
  try { await db.exec(sql); } catch { reviewConflictRejected = true; await db.exec('rollback'); }
  if (!reviewConflictRejected) throw new Error('Changed review metadata was silently accepted');
  await db.query('update public.content_versions set reviewed_at=null, review_reference=null where id=$1', [draft.version_id]);
  // Simulate later catalog columns in addition to exercising the real foundation schema.
  await db.exec('alter table public.content_versions add column context text, add column delivery_contract smallint not null default 1');
  for (const column of ['context', 'delivery_contract']) {
    await db.query(`update public.content_versions set ${column}=$1 where id=$2`, [column === 'context' ? 'first_days' : 2, draft.version_id]);
    let metadataConflictRejected = false;
    try { await db.exec(sql); } catch { metadataConflictRejected = true; await db.exec('rollback'); }
    if (!metadataConflictRejected) throw new Error(`Changed ${column} was silently accepted`);
    await db.query(`update public.content_versions set ${column}=$1 where id=$2`, [column === 'context' ? null : 1, draft.version_id]);
  }
  await db.exec(sql);

  await db.query('update public.training_steps set instruction=$1 where id=$2', ['changed', draft.steps[0].id]);
  let conflictRejected = false;
  try { await db.exec(sql); } catch { conflictRejected = true; await db.exec('rollback'); }
  if (!conflictRejected) throw new Error('Changed draft was silently accepted');
  const changed = await db.query('select instruction from public.training_steps where id=$1', [draft.steps[0].id]);
  if (changed.rows[0]?.instruction !== 'changed') throw new Error('Import overwrote an existing conflicting step');

  await db.exec("set request.jwt.claim.role = 'authenticated'");
  let jwtRejected = false;
  try { await db.exec(sql); } catch { jwtRejected = true; await db.exec('rollback'); }
  if (!jwtRejected) throw new Error('JWT-scoped import was not rejected');
  console.log('PASS: foundation schema and AI-origin migration; retry, draft RLS, review/catalog metadata conflicts, step conflict and JWT guard');
} finally {
  await db.close();
}
