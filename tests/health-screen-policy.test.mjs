import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const health = await readFile(new URL('../src/features/health/HealthScreen.tsx', import.meta.url), 'utf8');
const history = await readFile(new URL('../src/features/health/HealthHistoryScreen.tsx', import.meta.url), 'utf8');

test('Hälsa uses design-system controls and the approved sheet/list layout', () => {
  for (const component of ['BottomSheet', 'Field', 'ListRow', 'ActionMenu', 'EmptyState', 'Skeleton', 'InfoBanner']) {
    assert.match(`${health}\n${history}`, new RegExp(`<${component}[\\s>]`));
  }
  assert.match(health, /title="Planerade hälsohändelser"/);
  assert.match(health, /label="Lägg till"/);
  assert.match(health, /kind="date"/);
  assert.match(history, /<InfoModal/);
  assert.doesNotMatch(`${health}\n${history}`, /Ägarregistrerad.*badge|styles\.plannedCard/);
});

test('Hälsa covers loading, empty, error and normal states without legacy banners', () => {
  for (const state of ["loading", "error", "ready"]) assert.match(`${health}\n${history}`, new RegExp(`=== '${state}'`));
  assert.match(health, /<EmptyState/);
  assert.match(history, /<EmptyState/);
  assert.doesNotMatch(health, /<MessageCard|<PrimaryButton|<QuietButton/);
  assert.doesNotMatch(history, /<MessageCard|<PrimaryButton|<QuietButton/);
});
