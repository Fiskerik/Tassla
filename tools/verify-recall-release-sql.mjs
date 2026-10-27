import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';

const root = process.env.TASSLA_SQL_TOOLS ?? '/tmp/tassla-sql-tools';
const { PGlite } = await import(pathToFileURL(path.join(root, 'node_modules/@electric-sql/pglite/dist/index.js')).href);
const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const draft = JSON.parse(await read('docs/content/recall-program-v1.json'));
const draftSql = await read('supabase/content/recall-program-draft-v1.sql');
const releaseSql = await read('supabase/migrations/202610270001_recall_training_program.sql');

async function setup() {
  const db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;`);
  await db.exec(await read('supabase/migrations/202610040001_foundation.sql'));
  await db.exec(await read('supabase/migrations/202610110002_puppy_checklists.sql'));
  await db.exec(await read('supabase/migrations/202610180002_content_ai_origin.sql'));
  await db.exec(await read('supabase/migrations/202610240001_training_progression.sql'));
  await db.exec(await read('supabase/migrations/202610240002_knowledge_catalog.sql'));
  await db.exec(await read('supabase/migrations/202610240003_article_delivery.sql'));
  return db;
}

const db = await setup();
try {
  await db.exec(draftSql);
  await db.exec(releaseSql);
  await db.exec(await read('supabase/migrations/202610270002_training_milestone_undo.sql'));
  await db.exec(releaseSql); // Exact replay must not modify published content.
  const version = await db.query('select status, is_ai_generated, review_reference, reviewed_at, published_at from public.content_versions where id=$1', [draft.version_id]);
  if (version.rows.length !== 1 || version.rows[0].status !== 'published' || !version.rows[0].is_ai_generated
      || !version.rows[0].review_reference.startsWith('ai-assisted-dog-expert:recall-v1:') || !version.rows[0].reviewed_at || !version.rows[0].published_at) {
    throw new Error(`Unexpected published version: ${JSON.stringify(version.rows)}`);
  }
  await db.exec('set role authenticated');
  const versions = await db.query('select count(*)::int as total from public.content_versions where id=$1', [draft.version_id]);
  const items = await db.query('select count(*)::int as total from public.content_items where id=$1', [draft.content_id]);
  const steps = await db.query('select count(*)::int as total from public.training_steps where program_version_id=$1', [draft.version_id]);
  await db.exec('reset role');
  if (versions.rows[0].total !== 1 || items.rows[0].total !== 1 || steps.rows[0].total !== 6) throw new Error('Published content is not visible via RLS');
  await db.exec('reset role');
  const owner = randomUUID(); const other = randomUUID(); const dog = randomUUID();
  await db.query('insert into auth.users(id) values($1),($2)', [owner, other]);
  await db.query("insert into public.breeds(id,name) values('fixture','Fixture')");
  await db.query("insert into public.dogs(id,name,breed_id,birth_date) values($1,'Fixture','fixture','2026-01-01')", [dog]);
  await db.query('insert into public.dog_memberships(dog_id,user_id) values($1,$2)', [dog, owner]);
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${owner}'`);
  const call = (action, step = null, feedback = null) => db.query('select public.apply_training_operation($1,$2,$3,$4,$5,$6) as result', [dog, draft.version_id, randomUUID(), action, step, feedback]);
  await call('start_or_resume');
  for (const [index, step] of draft.steps.entries()) {
    await call('record_session', step.id, 'practice_more');
    await call('confirm_step', step.id);
    if (index < draft.steps.length - 1) await call('next', step.id);
  }
  const milestones = await db.query('select count(*)::int as total from public.training_milestones where dog_id=$1 and confirmed_at is not null', [dog]);
  if (milestones.rows[0].total !== 6) throw new Error('Owner progression did not persist all six dated confirmations');
  const lastStep = draft.steps.at(-1).id;
  const original = await db.query('select id from public.training_milestones where dog_id=$1 and step_id=$2', [dog, lastStep]);
  const oldMilestone = original.rows[0].id; const undoOperation = randomUUID();
  const undo = () => db.query('select public.undo_training_milestone($1,$2,$3,$4,$5) as result', [dog, draft.version_id, undoOperation, lastStep, oldMilestone]);
  const firstUndo = await undo();
  const retryUndo = await undo();
  if (JSON.stringify(firstUndo.rows[0].result) !== JSON.stringify(retryUndo.rows[0].result)) throw new Error('Undo retry changed its receipt');
  const afterUndo = await db.query('select (select count(*)::int from public.training_milestones where dog_id=$1) as milestones, (select count(*)::int from public.training_sessions where dog_id=$1) as sessions', [dog]);
  if (afterUndo.rows[0].milestones !== 5 || afterUndo.rows[0].sessions !== 6) throw new Error('Undo changed unrelated progress or sessions');
  await call('confirm_step', lastStep);
  let staleUndoRejected = false;
  try { await db.query('select public.undo_training_milestone($1,$2,$3,$4,$5)', [dog, draft.version_id, randomUUID(), lastStep, oldMilestone]); } catch { staleUndoRejected = true; }
  if (!staleUndoRejected) throw new Error('Stale undo removed a newer confirmation');
  const restored = await db.query('select id from public.training_milestones where dog_id=$1 and step_id=$2', [dog, lastStep]);
  if (restored.rows.length !== 1 || restored.rows[0].id === oldMilestone) throw new Error('Newer confirmation was not preserved');
  await undo(); // A delayed retry of the old receipt must not remove the newer confirmation.
  const afterDelayedRetry = await db.query('select id from public.training_milestones where dog_id=$1 and step_id=$2', [dog, lastStep]);
  if (afterDelayedRetry.rows[0]?.id !== restored.rows[0].id) throw new Error('Old retry removed a newer confirmation');
  await db.exec(`set request.jwt.claim.sub = '${other}'`);
  const foreignRows = await db.query('select count(*)::int as total from public.training_milestones where dog_id=$1', [dog]);
  if (foreignRows.rows[0].total !== 0) throw new Error('Another user can read owner progression');
  let foreignWriteRejected = false;
  try { await call('start_or_resume'); } catch { foreignWriteRejected = true; }
  if (!foreignWriteRejected) throw new Error('Another user can start the owner dog\'s training');
  let foreignUndoRejected = false;
  try { await db.query('select public.undo_training_milestone($1,$2,$3,$4,$5)', [dog, draft.version_id, randomUUID(), lastStep, restored.rows[0].id]); } catch { foreignUndoRejected = true; }
  if (!foreignUndoRejected) throw new Error('Another user can undo the owner dog\'s milestone');
  await db.exec('reset role');
  let protectedVersion = false;
  try { await db.query('update public.training_steps set title=$1 where id=$2', ['changed', draft.steps[0].id]); }
  catch { protectedVersion = true; }
  if (!protectedVersion) throw new Error('Published step was mutable');
} finally { await db.close(); }

const collisionDb = await setup();
try {
  await collisionDb.exec(draftSql);
  await collisionDb.query('update public.training_steps set instruction=$1 where id=$2', ['unrelated editorial change', draft.steps[0].id]);
  let rejected = false;
  try { await collisionDb.exec(releaseSql); } catch { rejected = true; await collisionDb.exec('rollback'); }
  if (!rejected) throw new Error('Conflicting step was accepted for publication');
  const version = await collisionDb.query('select status from public.content_versions where id=$1', [draft.version_id]);
  const step = await collisionDb.query('select instruction from public.training_steps where id=$1', [draft.steps[0].id]);
  if (version.rows[0].status !== 'draft' || step.rows[0].instruction !== 'unrelated editorial change') throw new Error('Failed publication changed existing content');
} finally { await collisionDb.close(); }

console.log('PASS: recall release, six dated milestones, compare-and-set undo with retry, owner isolation, exact replay and conflict protection');
