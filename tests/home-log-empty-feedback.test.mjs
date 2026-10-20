import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');
const home = source('../src/features/home/HomeScreen.tsx');
const workspace = source('../src/features/home/ProductWorkspace.tsx');
const log = source('../src/features/puppy-log/LogScreen.tsx');

test('Home empty content uses its existing Knowledge destination and content errors retry in place', () => {
  assert.match(home, /<DestinationTile destination="knowledge" compact variant="home" onPress=\{\(\) => onGo\('knowledge'\)\} \/>/);
  assert.match(workspace, /const navigateMainTab = useCallback\(\(destination: ProductPage\) => \{[\s\S]*?setPage\(destination\)/);
  assert.match(home, /contentState === 'error' \? <Button variant="tertiary" label="Hämta guider igen"[^\n]*onPress=\{onRetryContent\} \/> : null/);
  assert.match(workspace, /onRetryContent=\{\(\) => \{ void retryContent\(\); \}\}/);
  assert.match(workspace, /onGo=\{\(destination\) => \{[\s\S]*?navigateMainTab\(destination\)/);
});

test('Home training errors point to the existing Träna destination and its same-scope retry screen', () => {
  assert.match(home, /Träningen kunde inte hämtas just nu\. Öppna Träna för att försöka igen\./);
  assert.match(home, /<DestinationTile destination="training" compact variant="home" onPress=\{\(\) => onGo\('training'\)\} \/>/);
  assert.match(workspace, /visibleTrainingState === 'error'[\s\S]*?PrimaryButton title="Försök igen" onPress=\{\(\) => \{ void retryTraining\(\); \}\}/);
});

test('Home daily empty state opens the manager and successful selections are confirmed by a scoped reread', () => {
  assert.match(home, /dailyState === 'ready' && dailyActivities\.length === 0[\s\S]*?label="Hantera dagens aktiviteter"[^\n]*onPress=\{\(\) => openManager\(\)\}/);
  assert.match(home, /activities=\{dailyActivities\}/);
  assert.match(workspace, /onRetryDaily=\{\(\) => \{ void reloadDailyActivity\(true\); \}\}/);
  assert.match(workspace, /if \(outcome\.status === 'saved'\)[\s\S]*?const refreshed = await reloadDailyActivity\(true, true\)/);
  assert.match(workspace, /Ändringen sparades, men dagens lista kunde inte hämtas/);
});

test('Log empty feedback points to the add-event sheet while partial paging keeps its own state', () => {
  assert.match(log, /dayReadComplete && timelineItems\.length === 0[\s\S]*?Tryck på Lägg till händelse nedan för fler val/);
  assert.match(log, /accessibilityLabel="Lägg till händelse"[^\n]*setAddEventVisible\(true\)/);
  assert.match(log, /const dayReadComplete = !hasMore \|\| hasOlderDateBoundary/);
  assert.match(log, /!dayReadComplete && !loadMoreError[\s\S]*?Söker efter fler händelser/);
  assert.match(log, /visible=\{loadMoreError\} tone="error" message="Äldre poster kunde inte hämtas" onRetry=\{onLoadMore/);
});

test('initial Home and Log failures are distinct from scoped loading skeletons', () => {
  assert.match(home, /contentState === 'loading' \? <Skeleton/);
  assert.match(home, /dailyState === 'loading' \? <Skeleton/);
  assert.match(home, /dailyState === 'error' \? <View style=\{styles\.dailyState\}/);
  assert.match(log, /\{loading \? <>[\s\S]*?<Skeleton shape="card"/);
  assert.match(log, /: loadError \? <View style=\{styles\.errorState\}/);
  assert.match(log, /refreshError[\s\S]*?Dina visade händelser är kvar/);
});


test('Log event selection reaches the existing dog-scoped writer and displays only its confirmed result', () => {
  assert.match(log, /function selectType\([\s\S]*?setAddEventVisible\(false\)[\s\S]*?onAdd\(type\)/);
  assert.match(workspace, /if \(page === 'log'\) return <LogScreen events=\{displayEvents\} onAdd=\{addEvent\}/);
  assert.match(workspace, /function addEvent\([\s\S]*?dog_id: dog\.id[\s\S]*?runLogMutation\(mutation\)/);
  assert.match(workspace, /if \(outcome\.status === 'saved'\)[\s\S]*?const confirmedEvent = outcome\.value[\s\S]*?setEvents\(merged\)/);
  assert.match(log, /mutation\?\.kind === 'add' && mutation\.status === 'saved' && events\.some\(\(event\) => event\.id === mutation\.id\)/);
});
