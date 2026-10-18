import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRoutineIconLabel, routineIconCategory, selectUpcomingWeekPreview } from '../src/features/home/checklist-presentation.ts';

test('routine icon labels use the exact Swedish aliases after trim, NFC, lowercase and whitespace normalization', () => {
  const aliases = {
    pee: ['kiss', 'kissa', 'kisspaus'],
    poop: ['bajs', 'bajsa'],
    food: ['mat', 'äta', 'mata', 'måltid'],
    sleep: ['sömn', 'sova', 'vila'],
    walk: ['promenad', 'gå ut'],
    water: ['vatten', 'dricka'],
  };
  for (const [category, labels] of Object.entries(aliases)) {
    for (const label of labels) assert.equal(routineIconCategory(label), category, `${label} maps to ${category}`);
  }
  assert.equal(routineIconCategory('  KISS  '), 'pee');
  assert.equal(routineIconCategory('GÅ   UT'), 'walk');
  assert.equal(normalizeRoutineIconLabel('  MAT\tRUTIN  '), 'mat rutin');
  assert.equal(routineIconCategory('sömn'), 'sleep', 'decomposed Unicode is normalized to NFC');
});

test('routine icon near matches and unknown labels stay neutral without fuzzy or diacritic-stripped matching', () => {
  for (const label of ['kissrunda', 'matskål', 'sov gott', '', '   ', 'sömnigt', 'ata']) {
    assert.equal(routineIconCategory(label), null, `${label} remains neutral`);
  }
});

test('week preview excludes today and next Monday, includes Sunday, preserves order and caps at three', () => {
  const rows = [
    { id: 'tuesday', dateKey: '2026-10-20' },
    { id: 'today', dateKey: '2026-10-19' },
    { id: 'sunday', dateKey: '2026-10-25' },
    { id: 'next-monday', dateKey: '2026-10-26' },
    { id: 'thursday', dateKey: '2026-10-22' },
    { id: 'wednesday', dateKey: '2026-10-21' },
  ];
  const preview = selectUpcomingWeekPreview(rows, '2026-10-19', '2026-10-25');
  assert.deepEqual(preview.rows.map((row) => row.id), ['tuesday', 'sunday', 'thursday']);
  assert.equal(preview.total, 4);
  assert.equal(preview.hasMore, true);
  const exactlyThree = selectUpcomingWeekPreview(rows.slice(0, 4), '2026-10-19', '2026-10-25');
  assert.equal(exactlyThree.hasMore, false);
  assert.deepEqual(selectUpcomingWeekPreview(rows, '2026-10-19', '2026-10-25', 0).rows, []);
});
