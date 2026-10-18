import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const toolsRoot = process.env.TASSLA_UI_TOOLS;
const chrome = process.env.TASSLA_CHROME;
if (!toolsRoot || !chrome) throw new Error('TASSLA_UI_TOOLS and TASSLA_CHROME are required');
const { chromium } = await import(pathToFileURL(path.join(toolsRoot, 'node_modules/playwright/index.mjs')).href);
const root = process.cwd();
const outRoot = path.join(root, 'docs/design/evidence/vision-rev02/insights');
const browser = await chromium.launch({ headless: true, executablePath: chrome });
const cases = [];
const interactions = [];
const pageErrors = [];
const blockedRequests = [];

async function fresh(mode, port, query, viewport = { width: 375, height: 844 }) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => pageErrors.push(mode + query + ': ' + error.message));
  page.on('request', (request) => {
    const host = new URL(request.url()).hostname;
    if (!['127.0.0.1', 'localhost'].includes(host)) blockedRequests.push(mode + query + ': ' + request.url());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:' + port + '/' + query, { waitUntil: 'domcontentloaded' });
  return page;
}


async function activeScrollHandler(page) {
  return page.evaluateHandle(() => {
    const viewport = document.querySelector('[data-testid="review-app-viewport"]');
    const scroller = [...(viewport?.querySelectorAll('*') ?? [])].find((element) => element.scrollHeight > element.clientHeight + 10
      && getComputedStyle(element).overflowY === 'auto');
    if (!scroller) return null;
    const props = Object.keys(scroller).map((key) => scroller[key]).find((value) => value && typeof value.onScroll === 'function');
    return props?.onScroll ?? null;
  });
}

async function invokeScrollHandler(handler, offset) {
  return handler.evaluate((onScroll, y) => {
    if (typeof onScroll !== 'function') return false;
    onScroll({ nativeEvent: { contentOffset: { y } }, stopPropagation() {}, preventDefault() {} });
    return true;
  }, offset);
}

async function captureCase(mode, port, label, query, viewport, checks, scaleText = false) {
  const page = await fresh(mode, port, query, viewport);
  await page.getByRole('heading', { name: 'Översikt' }).waitFor();
  if (scaleText) {
    await page.evaluate(() => {
      for (const element of document.querySelectorAll('*')) {
        if (![...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim())) continue;
        const size = Number.parseFloat(getComputedStyle(element).fontSize);
        if (Number.isFinite(size)) element.style.setProperty('font-size', String(size * 1.4) + 'px', 'important');
      }
    });
  }
  const data = await page.evaluate(() => ({
    text: document.body.innerText,
    width: document.documentElement.scrollWidth,
    hasTabs: document.querySelector('[role="tablist"][aria-label="Välj period"]')?.querySelectorAll('[role="tab"]').length === 3,
    chart: document.body.innerText.includes('Kiss och Bajs'),
    visibleGap: document.body.innerText.includes('Ej loggat'),
  }));
  const passes = [];
  const failures = [];
  const assert = (condition, label) => (condition ? passes : failures).push(label);
  assert(data.hasTabs, 'three period choices');
  if (checks.expectChart !== undefined) assert(data.chart === checks.expectChart, 'expected chart visibility');
  if (checks.expectGap !== undefined) assert(data.visibleGap === checks.expectGap, 'expected gap disclosure');
  if (checks.expectCopy) assert(data.text.includes(checks.expectCopy), 'expected state copy');
  if (checks.expectTestId) assert(await page.getByTestId(checks.expectTestId).count() === 1, 'expected test id ' + checks.expectTestId);
  if (checks.absentTestId) assert(await page.getByTestId(checks.absentTestId).count() === 0, 'zero-count bar omitted: ' + checks.absentTestId);
  if (checks.presentTestId) assert(await page.getByTestId(checks.presentTestId).count() === 1, 'positive-count bar rendered: ' + checks.presentTestId);
  assert(data.width <= viewport.width, 'no horizontal page overflow');
  const folder = path.join(outRoot, mode);
  await fs.mkdir(folder, { recursive: true });
  const filename = mode + '-insights-' + label + '.png';
  await page.screenshot({ path: path.join(folder, filename), animations: 'disabled' });
  cases.push({ mode, viewport: label, documentWidth: data.width, passes, failures, screenshot: filename });
  await page.close();
}

for (const config of [{ mode: 'public', port: 8785 }, { mode: 'review', port: 8786 }]) {
  for (const view of [
    { label: '375x844', viewport: { width: 375, height: 844 } },
    { label: '430x844', viewport: { width: 430, height: 844 } },
    { label: '375x667', viewport: { width: 375, height: 667 } },
    { label: '375x844-text-140', viewport: { width: 375, height: 844 }, scale: true },
  ]) {
    const categoryChecks = view.label === '375x844' ? { presentTestId: 'insights-pee-bar-2026-10-16', absentTestId: 'insights-poop-bar-2026-10-16' } : {};
    await captureCase(config.mode, config.port, view.label, '?screen=insights&today=2026-10-18',
      view.viewport, { expectChart: true, expectGap: true, ...categoryChecks }, view.scale === true);
  }
  for (const state of [
    { label: 'loading', query: '?screen=insights&state=loading', expected: 'Hämtar sparade loggar…', chart: false },
    { label: 'empty', query: '?screen=insights&state=empty', expected: 'Ingen historik ännu', chart: false },
    { label: 'period-empty', query: '?screen=insights&state=ready&insightsScenario=period-empty&today=2026-10-18', expected: 'Ingen räknad logg i perioden', chart: true, gap: true, testId: 'insights-empty-period' },
    { label: 'error', query: '?screen=insights&state=error', expected: 'Ingen delvis graf visas.', chart: false },
  ]) {
    await captureCase(config.mode, config.port, state.label + '-375x844', state.query,
      { width: 375, height: 844 }, { expectChart: state.chart, expectCopy: state.expected, ...(state.gap !== undefined ? { expectGap: state.gap } : {}), ...(state.testId ? { expectTestId: state.testId } : {}) });
  }
}

const page = await fresh('review', 8786, '?screen=log&today=2026-10-18&logScenario=split-day&logDate=2026-10-17');
await page.waitForTimeout(750);
const scrollState = await page.locator('[data-testid="review-app-viewport"]').evaluate((viewport) => {
  const scroller = [...viewport.querySelectorAll('*')].find((element) => element.scrollHeight > element.clientHeight + 10
    && getComputedStyle(element).overflowY === 'auto');
  if (!scroller) return { found: false, top: 0 };
  scroller.scrollTop = Math.min(120, scroller.scrollHeight - scroller.clientHeight);
  return { found: true, top: scroller.scrollTop };
});
await page.waitForTimeout(100);
const selectedPriorDate = (await page.locator('body').innerText()).includes('17 oktober');
const oldLogOnScroll = await activeScrollHandler(page);
await page.getByRole('button', { name: 'Öppna insikter för Kiss och Bajs' }).click();
await page.getByRole('heading', { name: 'Översikt' }).waitFor();
const opened = await page.evaluate(() => ({
  title: document.body.innerText.includes('Översikt'),
  logTabSelected: document.querySelector('[role="tab"][aria-selected="true"]') !== null
    || document.querySelector('[aria-current="page"]')?.textContent?.includes('Logg') === true,
  label: document.body.innerText.includes('Luna · sparade Kiss- och Bajsloggar'),
}));
const openPasses = Object.entries(opened).filter(([, value]) => value).map(([key]) => key);
const openFailures = Object.entries(opened).filter(([, value]) => !value).map(([key]) => key);
if (scrollState.found) openPasses.push('Logg scroll position captured');
else openFailures.push('Logg scroll position captured');
if (selectedPriorDate) openPasses.push('selected Logg date changed before opening');
else openFailures.push('selected Logg date changed before opening');
const firstInsightsOffset = await page.evaluate(() => {
  const viewport = document.querySelector('[data-testid="review-app-viewport"]');
  const scroller = [...(viewport?.querySelectorAll('*') ?? [])].find((element) => element.scrollHeight > element.clientHeight + 10
    && getComputedStyle(element).overflowY === 'auto');
  return scroller?.scrollTop ?? -1;
});
const insightsScroll = await page.evaluate(() => {
  const viewport = document.querySelector('[data-testid="review-app-viewport"]');
  const scroller = [...(viewport?.querySelectorAll('*') ?? [])].find((element) => element.scrollHeight > element.clientHeight + 10
    && getComputedStyle(element).overflowY === 'auto');
  if (!scroller) return { found: false, top: -1 };
  scroller.scrollTop = Math.min(120, scroller.scrollHeight - scroller.clientHeight);
  return { found: true, top: scroller.scrollTop };
});
await page.waitForTimeout(100);
let savedInsightsTop = await page.evaluate(() => {
  const viewport = document.querySelector('[data-testid="review-app-viewport"]');
  const scroller = [...(viewport?.querySelectorAll('*') ?? [])].find((element) => element.scrollHeight > element.clientHeight + 10
    && getComputedStyle(element).overflowY === 'auto');
  return scroller?.scrollTop ?? -1;
});
const oldInsightsOnScroll = await activeScrollHandler(page);
if (firstInsightsOffset === 0) openPasses.push('first Insights visit starts at zero');
else openFailures.push('first Insights visit starts at zero');
if (insightsScroll.found && insightsScroll.top > 0 && savedInsightsTop > 0) openPasses.push('user scroll on Insights captured');
else openFailures.push('user scroll on Insights captured');
const lateLogCallbackInvoked = await invokeScrollHandler(oldLogOnScroll, 0);
if (lateLogCallbackInvoked) openPasses.push('captured Log onScroll callback invoked after route change');
else openFailures.push('captured Log onScroll callback invoked after route change');
interactions.push({ label: 'open overview from Logg', passes: openPasses, failures: openFailures });

await page.getByRole('tab', { name: 'Månad' }).click({ force: true });
const rerenderOffset = await page.evaluate(() => {
  const viewport = document.querySelector('[data-testid="review-app-viewport"]');
  const scroller = [...(viewport?.querySelectorAll('*') ?? [])].find((element) => element.scrollHeight > element.clientHeight + 10
    && getComputedStyle(element).overflowY === 'auto');
  return scroller?.scrollTop ?? -1;
});
interactions.push({ label: 'same-key Insights rerender', passes: Math.abs(rerenderOffset - savedInsightsTop) <= 4 ? ['route offset retained'] : [], failures: Math.abs(rerenderOffset - savedInsightsTop) <= 4 ? [] : ['route offset retained'] });
const monthLabel = await page.locator('text=/oktober 2026/i').count();
const nextDisabledAtCurrent = await page.getByRole('button', { name: 'Nästa period' }).isDisabled();
await page.getByRole('button', { name: 'Nästa period' }).click({ force: true });
const currentMonthUnchanged = await page.locator('text=/oktober 2026/i').count();
await page.getByRole('button', { name: 'Föregående period' }).click();
const previousMonth = await page.locator('text=/september 2026/i').count();
interactions.push({ label: 'period and no-future navigation', passes: [
  ...(monthLabel > 0 ? ['month period visible'] : []),
  ...(nextDisabledAtCurrent ? ['future month disabled at current period'] : []),
  ...(currentMonthUnchanged > 0 ? ['disabled future navigation leaves current month unchanged'] : []),
  ...(previousMonth > 0 ? ['previous month selectable'] : []),
], failures: [
  ...(monthLabel === 0 ? ['month period visible'] : []),
  ...(!nextDisabledAtCurrent ? ['future month disabled at current period'] : []),
  ...(currentMonthUnchanged === 0 ? ['disabled future navigation leaves current month unchanged'] : []),
  ...(previousMonth === 0 ? ['previous month selectable'] : []),
] });

await page.getByRole('tab', { name: 'Sedan start' }).click();
const sinceStart = await page.locator('text=/januari 2026/i').count();
const monthRows = await page.locator('text=/oktober 2026/i').count();
interactions.push({ label: 'since-start uses local month buckets', passes: [
  ...(sinceStart > 0 ? ['first month in history visible'] : []),
  ...(monthRows > 0 ? ['current month visible'] : []),
], failures: [
  ...(sinceStart === 0 ? ['first month in history visible'] : []),
  ...(monthRows === 0 ? ['current month visible'] : []),
] });

await page.evaluate((top) => {
  const viewport = document.querySelector('[data-testid="review-app-viewport"]');
  const scroller = [...(viewport?.querySelectorAll('*') ?? [])].find((element) => element.scrollHeight > element.clientHeight + 10
    && getComputedStyle(element).overflowY === 'auto');
  if (scroller) scroller.scrollTop = top;
}, savedInsightsTop);
await page.waitForTimeout(100);
savedInsightsTop = await page.evaluate(() => {
  const viewport = document.querySelector('[data-testid="review-app-viewport"]');
  const scroller = [...(viewport?.querySelectorAll('*') ?? [])].find((element) => element.scrollHeight > element.clientHeight + 10
    && getComputedStyle(element).overflowY === 'auto');
  return scroller?.scrollTop ?? -1;
});
const logReturn = await page.getByRole('button', { name: 'Tillbaka till Logg' }).count();
if (logReturn) await page.getByRole('button', { name: 'Tillbaka till Logg' }).click();
else await page.getByRole('button', { name: /Tillbaka till Logg/ }).first().click();
await page.getByText('Logga', { exact: true }).waitFor();
const activeLog = await page.getByRole('button', { name: 'Öppna insikter för Kiss och Bajs' }).count();
const restored = await page.evaluate(() => {
  const viewport = document.querySelector('[data-testid="review-app-viewport"]');
  const scroller = [...(viewport?.querySelectorAll('*') ?? [])].find((element) => element.scrollHeight > element.clientHeight + 10
    && getComputedStyle(element).overflowY === 'auto');
  return { priorDate: document.body.innerText.includes('17 oktober'), scrollTop: scroller?.scrollTop ?? -1 };
});
const returnPasses = [];
const returnFailures = [];
if (activeLog) returnPasses.push('Logg restored'); else returnFailures.push('Logg restored');
if (restored.priorDate) returnPasses.push('previously selected Logg date restored'); else returnFailures.push('previously selected Logg date restored');
if (scrollState.found && Math.abs(restored.scrollTop - scrollState.top) <= 4) returnPasses.push('Logg scroll position restored'); else returnFailures.push('Logg scroll position restored');
const lateInsightsCallbackInvoked = await invokeScrollHandler(oldInsightsOnScroll, 0);
if (lateInsightsCallbackInvoked) returnPasses.push('captured Insights onScroll callback invoked after route change');
else returnFailures.push('captured Insights onScroll callback invoked after route change');
interactions.push({ label: 'return to same Logg view', passes: returnPasses, failures: returnFailures });
await page.getByRole('button', { name: 'Öppna insikter för Kiss och Bajs' }).click();
await page.getByRole('heading', { name: 'Översikt' }).waitFor();
const insightsReturnedTop = await page.evaluate(() => {
  const viewport = document.querySelector('[data-testid="review-app-viewport"]');
  const scroller = [...(viewport?.querySelectorAll('*') ?? [])].find((element) => element.scrollHeight > element.clientHeight + 10
    && getComputedStyle(element).overflowY === 'auto');
  return scroller?.scrollTop ?? -1;
});
interactions.push({ label: 'return to same Insights view', passes: Math.abs(insightsReturnedTop - savedInsightsTop) <= 4 ? ['Insights offset restored'] : [], failures: Math.abs(insightsReturnedTop - savedInsightsTop) <= 4 ? [] : ['Insights offset restored'] });
await page.close();

const failures = [...cases, ...interactions].filter((item) => item.failures?.length).map(({ failures: itemFailures, ...item }) => ({ ...item, failures: itemFailures }));
const result = {
  generatedAt: new Date().toISOString(),
  scope: 'FLOW-INSIGHTS-01 / R7 — synthetic saved-log fixtures only',
  configurations: ['public', 'review'],
  viewCases: cases.length,
  interactionCases: interactions.length,
  failures,
  pageErrors,
  blockedRequests,
  cases,
  interactions,
};
await fs.writeFile(path.join(outRoot, 'browser-results.json'), JSON.stringify(result, null, 2) + '\n', 'utf8');
await browser.close();
if (failures.length || pageErrors.length || blockedRequests.length) process.exitCode = 1;
