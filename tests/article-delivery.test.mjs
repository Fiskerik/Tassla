import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import * as articleTargeting from '../src/content/article-targeting.ts';
import { parseGuideBody } from '../src/features/knowledge/guide-body.ts';
import { createArticleSyncHandler } from '../supabase/functions/sync-drive-article/handler.ts';
const resolution = registerHooks({ resolve(s, c, next) { return next(s.startsWith('.') && !/\.[a-z0-9]+$/i.test(s) ? `${s}.ts` : s, c); } });
const { fetchKnowledgeContent } = await import('../src/data/workspace-data.ts');
resolution.deregister();
const articles = JSON.parse(await readFile(new URL('../docs/content/artiklar/drive-articles-v1.json', import.meta.url)));
const { matchesArticleRules } = articleTargeting;

test('planned homecoming matches Dec 8–15 regardless of the legacy 16-week maximum', () => {
  const rules = articles[0].rules;
  for (const day of ['2026-12-08', '2026-12-15']) assert.equal(matchesArticleRules(rules, 19, '2026-12-15', day), true);
  for (const day of ['2026-12-07', '2026-12-16']) assert.equal(matchesArticleRules(rules, 19, '2026-12-15', day), false);
  assert.equal(matchesArticleRules(rules, 19, null, '2026-12-08'), false);
  assert.equal(matchesArticleRules(rules, 260, '2026-12-15', '2026-12-08'), false);
  assert.equal(matchesArticleRules(rules, null, '2026-12-15', '2026-12-08'), false);
});

test('the three restored Drive articles are generic, unpersonalized and pinned to the original wording', () => {
  const fingerprints = {
    'forsta-dygnet-hemma': '1f06f169d0260d72c128f897d33ccff8e4f338d3edeca957e35454c9d6f27d47',
    rumsrenhet: '49b370eb1230ec4addb52537040de1de0188c726ebcd4bc2bf2d660638990174',
    'valpens-somn': 'b89cf1a5b2055ba712cdd5109d2cf84cdbd81125dd070493eaeddb7ed03da304',
  };
  for (const article of articles) {
    const digest = createHash('sha256').update(article.title + '\0' + article.body).digest('hex');
    assert.equal(digest, fingerprints[article.slug]);
    assert.doesNotMatch(article.title + article.body, /\{\{dog\./);
    assert.doesNotMatch(article.title + article.body, /\b(Nemo|Nala|Max|han|hon|honom|henne)\b/i);
  }
  assert.match(articles[0].body, /Den har lämnat sin mamma, sina syskon/);
  assert.match(articles[1].title, /valpen att lyckas/);
  assert.match(articles[2].body, /hur mycket den sover och när på dygnet den brukar vila/);
  assert.equal('personalizeArticle' in articleTargeting, false);
});

test('complete library includes nonmatching published articles; recommendations respect rules and breed', async () => {
  const rows = articles.map((a, index) => ({
    id: `version-${index}`, content_id: `content-${index}`, version: 1, status: 'published', title: a.title, body: a.body,
    min_age_weeks: a.min_age_weeks, max_age_weeks: a.max_age_weeks, sources: [], is_ai_generated: false,
    content_items: { slug: a.slug, content_type: 'article' }, content_breed_targets: [],
    article_version_metadata: { article_targeting_rules: a.rules },
  }));
  const client = createClient('https://synthetic.supabase.invalid', 'synthetic-key', {
    auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async (_url, options) => {
      assert.equal(new Headers(options.headers).get('x-client-info'), 'tassla-content/2');
      return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
    } },
  });
  try {
    const result = await fetchKnowledgeContent(client, { id: 'dog', name: 'Nala', breed_id: 'mixed' }, 260);
    assert.equal(result.length, 3);
    assert.ok(result.every((item) => !item.recommended));
    const puppy = await fetchKnowledgeContent(client, { id: 'dog-a', name: 'Nala', sex: 'female', breed_id: 'mixed', expected_homecoming_date: null }, 10);
    assert.deepEqual(puppy.map((a) => a.recommended), [false, true, true]);
    const alternateProfile = await fetchKnowledgeContent(client, { id: 'dog-b', name: 'Nemo', sex: 'male', breed_id: 'mixed', expected_homecoming_date: null }, 10);
    assert.deepEqual(alternateProfile.map(({ id, title, body }) => ({ id, title, body })), puppy.map(({ id, title, body }) => ({ id, title, body })));
    rows[1].content_breed_targets.push({ breed_id: 'beagle' });
    const otherBreed = await fetchKnowledgeContent(client, { id: 'dog', name: 'Nala', breed_id: 'mixed' }, 10);
    assert.equal(otherBreed[1].recommended, false);
    assert.equal(otherBreed.length, 3);
  } finally { await client.auth.dispose(); }
});

test('sync endpoint rejects missing/wrong tokens and oversized bodies before publishing', async () => {
  const secret = 's'.repeat(48);
  let calls = 0;
  const handler = createArticleSyncHandler({ token: secret, publish: async () => { calls++; return true; } });
  const send = (token, body) => handler(new Request('https://synthetic.invalid', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body }));
  assert.equal((await send('wrong', '{}')).status, 401);
  assert.equal((await send(secret, 'x'.repeat(500_001))).status, 413);
  assert.equal((await send(secret, '{broken')).status, 400);
  assert.equal(calls, 0);
  assert.equal((await send(secret, JSON.stringify({ article: articles[0] }))).status, 200);
  assert.equal(calls, 1);
});


test('restored articles preserve source paragraphs and headings without generated callouts', () => {
  for (const article of articles) {
    const blocks = parseGuideBody(article.body);
    assert.ok(blocks.some((block) => block.type === 'heading'));
    assert.ok(blocks.some((block) => block.type === 'paragraph'));
    assert.ok(!blocks.some((block) => block.type === 'callout'));
  }
  assert.deepEqual(parseGuideBody('> Viktigt: Kontakta veterinär vid oro.'), [
    { type: 'callout', tone: 'important', text: 'Kontakta veterinär vid oro.' },
  ]);
});

test('profile writes persist the optional fields with a nullable compare-and-swap preimage', async () => {
  const resolution = registerHooks({ resolve(s, c, next) { return next(s.startsWith('.') && !/\.[a-z0-9]+$/i.test(s) ? `${s}.ts` : s, c); } });
  const { updateOwnedDog } = await import('../src/data/app-data.ts');
  resolution.deregister();
  const before = { id: '11111111-1111-4111-8111-111111111111', name: 'Nemo', breed_id: 'mixed', birth_date: '2026-08-01', age_display_unit: 'weeks', expected_homecoming_date: null, sex: null };
  const changes = { ...before, expected_homecoming_date: '2026-12-15', sex: 'male' };
  let request;
  const client = createClient('https://synthetic.supabase.invalid', 'synthetic-key', {
    auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async (url, options) => {
      request = { url: new URL(url), body: JSON.parse(options.body) };
      return new Response(JSON.stringify(changes), { headers: { 'Content-Type': 'application/json' } });
    } },
  });
  try {
    const outcome = await updateOwnedDog(client, before.id, before, changes, [{ id: 'mixed', name: 'Blandras' }]);
    assert.equal(outcome.status, 'saved');
    assert.equal(request.url.searchParams.get('expected_homecoming_date'), 'is.null');
    assert.equal(request.url.searchParams.get('sex'), 'is.null');
    assert.equal(request.body.expected_homecoming_date, '2026-12-15');
    assert.equal(request.body.sex, 'male');
  } finally { await client.auth.dispose(); }
});
