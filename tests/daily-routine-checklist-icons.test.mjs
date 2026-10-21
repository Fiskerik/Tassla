import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';

const resolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const icons = await import('../src/features/home/daily-routine-checklist-icons.ts');
resolution.deregister();

const migration = await readFile(new URL('../supabase/migrations/202610210001_routine_checklist_item_presentation.sql', import.meta.url), 'utf8');
const IoniconGlyphs = JSON.parse(await readFile(new URL('../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json', import.meta.url), 'utf8'));

test('the persisted icon allowlist exactly matches installed Ionicons and SQL validation', () => {
  const iconNames = [...icons.DAILY_ROUTINE_CHECKLIST_ICONS];
  assert.equal(iconNames.length, 20);
  assert.equal(new Set(iconNames).size, iconNames.length);
  for (const icon of iconNames) assert.ok(Object.hasOwn(IoniconGlyphs, icon), `Ionicons is missing ${icon}`);
  const sqlAllowlist = [...migration.matchAll(/'([a-z-]+)'/g)].map((match) => match[1])
    .filter((name) => iconNames.includes(name));
  assert.deepEqual([...new Set(sqlAllowlist)], iconNames);
  assert.match(migration, /create or replace function private\.valid_daily_routine_checklist\(p_checklist jsonb\)/);
  assert.match(migration, /\[\[:space:\]\].*\[\[:space:\]\]/, 'SQL must reject tabs/newlines at the ends of labels and descriptions like JS trim()');
  assert.doesNotMatch(migration, /create\s+table|create\s+policy|alter\s+table|create\s+or\s+replace\s+function\s+public\./i);
});

test('legacy checklist points get stable, varied defaults while explicit choices are kept', () => {
  const legacy = Array.from({ length: icons.DAILY_ROUTINE_CHECKLIST_ICONS.length }, (_, index) => ({ id: `item-${index}`, label: `Punkt ${index}` }));
  const first = icons.assignDailyRoutineChecklistIcons(legacy);
  assert.deepEqual(icons.assignDailyRoutineChecklistIcons(legacy), first);
  assert.equal(new Set(first).size, legacy.length);

  const customized = [
    { id: 'one', icon: 'paw' },
    { id: 'two' },
    { id: 'three', icon: 'water-outline' },
  ];
  const result = icons.assignDailyRoutineChecklistIcons(customized);
  assert.equal(result[0], 'paw');
  assert.equal(result[2], 'water-outline');
  assert.notEqual(result[1], 'paw');
  assert.notEqual(result[1], 'water-outline');
  assert.equal(icons.isDailyRoutineChecklistIcon('walk-outline'), true);
  assert.equal(icons.isDailyRoutineChecklistIcon('not-an-ionicon'), false);
});
