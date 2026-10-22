import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire, registerHooks } from 'node:module';
import { dirname, join } from 'node:path';

const resolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const icons = await import('../src/features/home/daily-routine-checklist-icons.ts');
resolution.deregister();

const require = createRequire(import.meta.url);
const ioniconsEntry = require.resolve('@expo/vector-icons/Ionicons');
const glyphs = JSON.parse(await readFile(join(dirname(ioniconsEntry), 'build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'), 'utf8'));
const migration = await readFile(new URL('../supabase/migrations/202610220001_daily_routine_checklist_icons.sql', import.meta.url), 'utf8');

test('all persisted checklist icons and the neutral display icon exist in installed Ionicons', () => {
  assert.equal(icons.DAILY_ROUTINE_CHECKLIST_ICONS.length, 20);
  for (const icon of icons.DAILY_ROUTINE_CHECKLIST_ICONS) assert.ok(Object.hasOwn(glyphs, icon), `missing Ionicons glyph: ${icon}`);
  assert.ok(Object.hasOwn(glyphs, 'list-outline'), 'neutral legacy fallback has a real glyph');
});

test('SQL and TypeScript use the same exact persisted icon allowlist', () => {
  const match = migration.match(/v_item ->> 'icon' not in \(([\s\S]*?)\) then return false;/);
  assert.ok(match, 'migration contains the icon allowlist check');
  const sqlIcons = [...match[1].matchAll(/'([a-z-]+)'/g)].map((entry) => entry[1]);
  assert.deepEqual(sqlIcons, [...icons.DAILY_ROUTINE_CHECKLIST_ICONS]);
  assert.ok(!sqlIcons.includes('list-outline'), 'display fallback cannot be persisted');
});

test('legacy Swedish labels receive only one unambiguous semantic suggestion', () => {
  const cases = [
    ['Fyll på VATTEN', 'water-outline'],
    ['Gå en kort runda', 'walk-outline'],
    ['Vila en stund', 'bed-outline'],
    ['Lägg fram mat', 'restaurant-outline'],
    ['Torka tassar', 'paw'],
    ['Borsta pälsen', 'brush-outline'],
    ['Ge medicin', 'medkit-outline'],
    ['Lek med boll', 'football-outline'],
    ['Miljöträning – nya ljud', 'fitness-outline'],
    ['Förbered hemma', 'home-outline'],
  ];
  for (const [label, icon] of cases) assert.equal(icons.suggestDailyRoutineChecklistIcon(label), icon, label);
  assert.equal(icons.suggestDailyRoutineChecklistIcon('Kissa'), null);
  assert.equal(icons.suggestDailyRoutineChecklistIcon('Vatten och promenad'), null, 'conflicting matches use the neutral fallback');
});

test('display uses a saved icon first, then a suggestion, then the neutral icon without persisting it', () => {
  assert.equal(icons.dailyRoutineChecklistDisplayIcon({ label: 'Promenad', icon: 'water-outline' }), 'water-outline');
  assert.equal(icons.dailyRoutineChecklistDisplayIcon({ label: 'Fyll på vatten' }), 'water-outline');
  assert.equal(icons.dailyRoutineChecklistDisplayIcon({ label: 'Kissa' }), 'list-outline');
  assert.equal(icons.isDailyRoutineChecklistIcon('list-outline'), false);
});

test('only clear subject icons receive a category tone; generic choices stay neutral', () => {
  const expected = {
    paw: 'neutral',
    'water-outline': 'water',
    'walk-outline': 'walk',
    'bed-outline': 'sleep',
    'sunny-outline': 'neutral',
    'leaf-outline': 'neutral',
    'heart-outline': 'neutral',
    'flower-outline': 'neutral',
    'brush-outline': 'neutral',
    'bandage-outline': 'vaccination',
    'medkit-outline': 'veterinary',
    'restaurant-outline': 'food',
    'moon-outline': 'sleep',
    'football-outline': 'neutral',
    'fitness-outline': 'training',
    'sparkles-outline': 'neutral',
    'home-outline': 'neutral',
    'school-outline': 'training',
    'rose-outline': 'neutral',
    'star-outline': 'neutral',
    'list-outline': 'neutral',
  };
  for (const [icon, tone] of Object.entries(expected)) assert.equal(icons.dailyRoutineChecklistIconTone(icon), tone, icon);
});
