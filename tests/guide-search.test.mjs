import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    return specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)
      ? nextResolve(specifier + '.ts', context)
      : nextResolve(specifier, context);
  },
});
const search = await import('../src/features/knowledge/guide-search.ts');
hook.deregister();

const guide = (title, body) => ({ title, body });

test('normalizes Swedish casing, Unicode composition, and whitespace while preserving Swedish letters', () => {
  assert.equal(search.normalizeGuideSearchText('  HÄLSA\t  OCH\nVÄLMÅENDE '), 'hälsa och välmående');
  assert.equal(search.normalizeGuideSearchText('a\u0308'), 'ä');
  assert.equal(search.searchGuideItems([guide('Älg', 'Skog')], 'a\u0308lg').length, 1);
  assert.equal(search.searchGuideItems([guide('Ålder', 'Hund')], 'alder').length, 0);
  assert.equal(search.searchGuideItems([guide('Älg', 'Hund')], 'alg').length, 0);
  assert.equal(search.searchGuideItems([guide('Öron', 'Hund')], 'oron').length, 0);
});

test('searches title and parsed guide content, including headings, paragraphs, and list entries', () => {
  const items = [
    guide('Första veckan', '## Trygg start\nSkapa en lugn plats.\n- Mjuk bädd\n- Egen vattenskål'),
    guide('Matvanor', 'Servera maten regelbundet.'),
  ];
  assert.deepEqual(search.searchGuideItems(items, 'FÖRSTA'), [items[0]]);
  assert.deepEqual(search.searchGuideItems(items, 'trygg start'), [items[0]]);
  assert.deepEqual(search.searchGuideItems(items, 'egen vattenskål'), [items[0]]);
  assert.deepEqual(search.searchGuideItems(items, 'servera   maten'), [items[1]]);
});

test('blank search returns a copy in original order', () => {
  const items = [guide('B', 'text'), guide('A', 'text')];
  const result = search.searchGuideItems(items, ' \n\t ');
  assert.deepEqual(result, items);
  assert.notEqual(result, items);
});

test('search state is scoped by both session and dog and stale values are hidden immediately', () => {
  const luna = search.guideSearchScopeKey('account-1', 'dog-luna');
  const rex = search.guideSearchScopeKey('account-1', 'dog-rex');
  const otherSession = search.guideSearchScopeKey('account-2', 'dog-luna');
  const state = { scopeKey: luna, value: 'valp' };

  assert.notEqual(luna, rex);
  assert.notEqual(luna, otherSession);
  assert.equal(search.guideSearchValueForScope(state, luna), 'valp');
  assert.equal(search.guideSearchValueForScope(state, rex), '');
  assert.equal(search.guideSearchValueForScope(state, otherSession), '');
});
