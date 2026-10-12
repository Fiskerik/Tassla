import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const carousel = await readFile(new URL('../src/features/home/HomeCarousel.tsx', import.meta.url), 'utf8');
const home = await readFile(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/features/home/ProductWorkspace.tsx', import.meta.url), 'utf8');
const logModel = await readFile(new URL('../src/features/puppy-log/log-model.ts', import.meta.url), 'utf8');

test('HomeCarousel receives complete potty history separately from the Home timeline feed', () => {
  assert.match(home, /<HomeCarousel dog=\{dog\} pottyEvents=\{pottyEvents\} pottyHistoryState=\{pottyHistoryState\} pottyRetrying=\{pottyRetrying\} onRetryPotty=\{onRetryPotty\}/);
  assert.match(carousel, /pottyHistoryState === 'ready' \? summarizePottyRhythm\(pottyEvents, dog\.id, now, today\) : \[\]/);
  assert.match(carousel, /pottyEvents: readonly LogEvent\[\]/);
  assert.doesNotMatch(carousel, /logState/);
  assert.match(workspace, /fetchDogEvents\(client, dog\.id, 0, PAGE_SIZE/);
  assert.match(workspace, /fetchPottyEvents\(client, dog\.id, capturedNow/);
  assert.match(workspace, /const PAGE_SIZE = 40/);
});

test('loading, error, or an unavailable dog hides counts and all estimates', () => {
  assert.match(carousel, /pottyHistoryState === 'loading' \? <>[\s\S]*?<Skeleton/);
  assert.match(carousel, /pottyHistoryState === 'error' \? <Text style=\{styles\.summaryMessage\}>Vi kunde inte visa översikten just nu\.<\/Text>/);
  assert.match(carousel, /pottyHistoryState === 'ready' && !dog\.id\.trim\(\)/);
  assert.match(carousel, /pottyHistoryState === 'ready' && summaries\.length === 2/);
  assert.match(carousel, /if \(historyState === 'loading'\) return `\$\{heading\} Laddar översikten\./);
  assert.match(carousel, /if \(historyState === 'error'\) return `\$\{heading\} Vi kunde inte visa översikten just nu\./);
  assert.match(workspace, /status: 'loading', retrying: retry/);
  assert.match(workspace, /setPottyHistoryView\(\{ scope: lifetime, events: \[\], status: 'error'/);
});

test('Home retry is a separate no-navigation action with loading feedback and a duplicate tap guard', () => {
  assert.match(carousel, /<Button label="Försök igen" accessibilityLabel="Försök igen"[^>]+onPress=\{onRetryPotty\} disabled=\{pottyRetrying\} loading=\{pottyRetrying\}/);
  assert.match(carousel, /pottyRetrying \? <Text style=\{styles\.summaryMessage\}>Laddar översikten…/);
  assert.match(home, /onRetryPotty: \(\) => void/);
  assert.match(workspace, /onRetryPotty=\{\(\) => \{ void refreshPottyHistory\(true\); \}\}/);
  assert.match(workspace, /if \(retry && !canStartPottyHistoryRetry\(pottyRetryInFlight\.current\)\) return/);
  assert.match(workspace, /pottyRetryInFlight\.current = retry/);
  assert.match(workspace, /pottyHistoryView\.scope === currentPottyLifetime[\s\S]*?status: 'loading'/);
});

test('complete history refreshes on scope, foreground, midnight, and confirmed or uncertain mutations', () => {
  assert.match(workspace, /const currentPottyLifetime = `\$\{dog\.id\}:\$\{session\?\.user\.id \?\? ''\}:\$\{accountGeneration\}`/);
  assert.match(workspace, /pottyController\.current\?\.abort\(\)/);
  assert.match(workspace, /canPublishPottyHistoryResult\(\{/);
  assert.match(workspace, /currentGeneration: pottyGeneration\.current/);
  assert.match(workspace, /currentScope: pottyLifetime\.current/);
  assert.match(workspace, /if \(state === 'active'\) refresh\(\)/);
  assert.match(workspace, /nextMidnight\.setHours\(24, 0, 0, 0\)/);
  assert.match(workspace, /if \(outcome\.status === 'saved'\) \{\s*if \(pottyLifetime\.current === currentPottyLifetime\) void refreshPottyHistory\(\)/);
  assert.match(workspace, /if \(presentationStatus === 'unsure'\) \{\s*if \(pottyLifetime\.current === currentPottyLifetime\) void refreshPottyHistory\(\)/);
  assert.match(workspace, /if \(found\) \{\s*if \(pottyLifetime\.current === currentPottyLifetime\) void refreshPottyHistory\(\)/);
  assert.match(workspace, /if \(!isCurrent\(\)\) return false;\s*if \(pottyLifetime\.current === currentPottyLifetime\) void refreshPottyHistory\(\);\s*pendingLogMutation\.current = mutation;/);
});

test('estimated copy stays conditional and sourced, with no age-derived life stage', () => {
  assert.match(carousel, /condition: 'Ny valp · första veckorna'/);
  assert.match(carousel, /condition: 'Frisk, inaktiv vuxen'/);
  assert.match(carousel, /condition: 'Valp efter måltid'/);
  assert.match(carousel, /condition: 'De flesta hundar'/);
  assert.match(carousel, /source: 'Agria'/);
  assert.match(carousel, /source: 'AniCura'/);
  assert.match(carousel, /source: 'VCA'/);
  assert.match(carousel, /Källa: \{guidance\.source\}/);
  assert.doesNotMatch(carousel.slice(carousel.indexOf('const ESTIMATED_GUIDANCE'), carousel.indexOf('export function HomeCarousel')), /birth_date|formatDogAge/);
});

test('personal interval describes logged events and places required copy after each window', () => {
  assert.match(carousel, /Typiskt intervall mellan loggade händelser: cirka \{formatInterval\(summary\.medianIntervalMinutes\)\}/);
  assert.match(carousel, /const PERSONAL_WINDOW_DISCLOSURE = 'Ungefärligt tidsfönster utifrån dina loggar\.'/);
  assert.match(carousel, /<Text style=\{styles\.modeLabel\}>Rekommenderad<\/Text>\s*<Text style=\{styles\.windowTime\}>\{formatWindow/);
  assert.match(carousel, /<Text style=\{styles\.disclosure\}>\{PERSONAL_WINDOW_DISCLOSURE\}<\/Text>/);
  assert.match(carousel, /parts\.push\(formatWindow\(summary\.windowStart, summary\.windowEnd, today\)\);\s*parts\.push\(PERSONAL_WINDOW_DISCLOSURE\);/);
  assert.match(carousel, /Tiderna varierar\./);
  assert.match(carousel, /if \(summary\.windowStart && summary\.windowEnd\)/);
});

test('daily history is local, the estimate card opens Logg, and a passed window is not rendered', () => {
  assert.match(carousel, /formatDailyCount\(summary\.todayCount\)/);
  assert.match(carousel, /formatLatest\(summary\.latestOccurredAt, today\)/);
  assert.match(carousel, /<PottySummaryCard[\s\S]*?onOpenLog=\{\(\) => onGo\('log'\)\}/);
  assert.match(logModel, /const hasFutureWindow = windowEndMs > now\.getTime\(\)/);
  assert.match(logModel, /windowStart: hasFutureWindow \? new Date\(windowStartMs\)\.toISOString\(\) : null/);
  assert.match(logModel, /windowEnd: hasFutureWindow \? new Date\(windowEndMs\)\.toISOString\(\) : null/);
});

test('Home refreshes the device date on foreground and local midnight, cleaning up its timer', () => {
  assert.match(home, /AppState\.addEventListener\('change', \(state\) => \{\s*if \(state === 'active'\) refreshLocalDay\(\);/);
  assert.match(home, /nextMidnight\.setHours\(24, 0, 0, 0\)/);
  assert.match(home, /midnightTimer = setTimeout\(refreshLocalDay/);
  assert.match(home, /if \(midnightTimer\) clearTimeout\(midnightTimer\)/);
  assert.match(home, /subscription\.remove\(\)/);
  assert.match(home, /if \(selectedRef\.current === previousToday\)[\s\S]*?setSelected\(nextToday\)/);
  assert.match(home, /today=\{today\}/);
});

test('HomeCarousel suppresses windows when the clock reaches their end and refreshes after foreground', () => {
  assert.match(carousel, /const nextWindowEnd = summaries[\s\S]*?summary\.windowEnd \? Date\.parse\(summary\.windowEnd\)/);
  assert.match(carousel, /setTimeout\(\(\) => setNow\(new Date\(\)\)/);
  assert.match(carousel, /if \(state === 'active'\) setNow\(new Date\(\)\)/);
});
