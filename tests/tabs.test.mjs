import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [tabs, checklist, health, gallery] = await Promise.all([
  readFile(new URL('../src/components/ui/Tabs.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/home/DailyChecklistScreen.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/health/HealthScreen.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/ui/ComponentGalleryScreen.tsx', import.meta.url), 'utf8'),
]);

test('Checklist strong selected segment uses the Rev02 green without changing existing segmented tabs', () => {
  assert.match(tabs, /'rev02-segmented' \| 'rev02-segmented-strong'/);
  assert.match(tabs, /const strongSelected = variant === 'rev02-segmented-strong'/);
  assert.match(tabs, /selected && strongSelected && styles\.segmentedSelectedStrong/);
  assert.match(tabs, /selected && strongSelected && styles\.segmentedActiveStrong/);
  assert.match(tabs, /segmentedSelectedStrong: \{ backgroundColor: tokens\.colors\.home\.greenStrong \}/);
  assert.match(tabs, /segmentedActiveStrong: \{ color: tokens\.colors\.onPrimary \}/);
  assert.match(checklist, /variant="rev02-segmented-strong"/);
  assert.match(health, /variant="rev02-segmented"/);
  assert.match(gallery, /variant="rev02-segmented"/);
  assert.match(tabs, /segmentedSelected: \{ backgroundColor: tokens\.colors\.training\.selectedSurface \}/);
  assert.match(tabs, /segmentedActive: \{ color: tokens\.colors\.training\.accent \}/);
});
