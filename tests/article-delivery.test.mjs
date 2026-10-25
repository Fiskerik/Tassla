import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { matchesArticleRules, personalizeArticle } from '../src/content/article-targeting.ts';
import { parseGuideBody } from '../src/features/knowledge/guide-body.ts';
import { createArticleSyncHandler } from '../supabase/functions/sync-drive-article/handler.ts';
const resolution = registerHooks({ resolve(s, c, next) { return next(s.startsWith('.') && !/\.[a-z0-9]+$/i.test(s) ? `${s}.ts` : s, c); } });
const { fetchKnowledgeContent } = await import('../src/data/workspace-data.ts');
resolution.deregister();
const articles = JSON.parse(await readFile(new URL('../docs/content/artiklar/drive-articles-v1.json', import.meta.url)));

test('planned homecoming matches Dec 8–15 regardless of the legacy 16-week maximum', () => {
  const rules = articles[0].rules;
  for (const day of ['2026-12-08', '2026-12-15']) assert.equal(matchesArticleRules(rules, 19, '2026-12-15', day), true);
  for (const day of ['2026-12-07', '2026-12-16']) assert.equal(matchesArticleRules(rules, 19, '2026-12-15', day), false);
  assert.equal(matchesArticleRules(rules, 19, null, '2026-12-08'), false);
  assert.equal(matchesArticleRules(rules, 260, '2026-12-15', '2026-12-08'), false);
  assert.equal(matchesArticleRules(rules, null, '2026-12-15', '2026-12-08'), false);
});

test('the exact articles expand Nemo/han, Nala/hon and unknown-sex fallback without altering advice or generic plurals', () => {
  for (const article of articles) {
    for (const [name, sex] of [['Nemo', 'male'], ['Nala', 'female'], ['Max', null]]) {
      const rendered = personalizeArticle(article.body, { name, sex });
      assert.ok(rendered.includes(name));
      assert.ok(!rendered.includes('{{dog.'));
      assert.ok(!/\b(hans|hennes)s\b/.test(rendered));
    }
  }
  assert.match(personalizeArticle(articles[0].body, { name: 'Nemo', sex: 'male' }), /Han har lämnat/);
  assert.match(personalizeArticle(articles[0].body, { name: 'Nala', sex: 'female' }), /Hon har lämnat/);
  assert.match(personalizeArticle(articles[0].body, { name: 'Max', sex: null }), /Max har lämnat/);
  assert.equal(personalizeArticle('Andra hundar och en valp. {{dog.genitive}} bädd.', { name: 'Max' }), 'Andra hundar och en valp. Max bädd.');
  assert.equal(personalizeArticle('{{dog.name}}', { name: '{{dog.subject}}', sex: 'male' }), '{{dog.subject}}');
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
    const puppy = await fetchKnowledgeContent(client, { id: 'dog', name: 'Nala', breed_id: 'mixed' }, 10);
    assert.deepEqual(puppy.map((a) => a.recommended), [false, true, true]);
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


test('reviewed article tips become explicit styled blocks without duplicating or losing advice', () => {
  for (const article of articles) {
    const blocks = parseGuideBody(article.body);
    assert.ok(blocks.some((block) => block.type === 'callout' && block.tone === 'tip'));
    assert.ok(blocks.some((block) => block.type === 'paragraph'));
    assert.ok(!blocks.some((block) => block.type === 'paragraph' && block.text.startsWith('> ')));
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
