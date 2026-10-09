import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import ts from 'typescript';

const tsResolution = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier);
  },
});
const passport = await import('../src/features/passport/passport-model.ts');
tsResolution.deregister();
const exporterSource = await readFile(new URL('../src/features/passport/passport-export.ts', import.meta.url), 'utf8');
const appFlowSource = await readFile(new URL('../src/features/home/AppFlow.tsx', import.meta.url), 'utf8');
const passportScreenSource = await readFile(new URL('../src/features/passport/PassportScreen.tsx', import.meta.url), 'utf8');

const dog = { id: '11111111-1111-4111-8111-111111111111', name: 'Nala', breed_id: 'beagle', birth_date: '2023-02-12' };
const profileSelection = { profile: true, latestWeight: true, healthHistory: true };

test('snapshot contains only saved profile, newest recorded weight, and performed health history', () => {
  const snapshot = passport.createPassportSnapshot({
    dog,
    breedName: 'Beagle',
    weights: [weight('weight-1', '2025-04-01', 12.2), weight('weight-2', '2025-04-03', 12.4), weight('weight-3', '2025-03-31', 11.9)],
    performedHistory: [
      health('health-1', 'vaccination', '2025-04-01', 'Booster'),
      health('health-2', 'vet_visit', '2025-04-04', 'Checkup'),
      health('health-planned', 'planned_vaccination', '2025-04-05', 'Not performed'),
    ],
    selection: profileSelection,
    createdOn: '2026-10-06',
  });
  assert.deepEqual(snapshot.dog, { name: 'Nala', breed: 'Beagle', birthDate: '2023-02-12' });
  assert.deepEqual(snapshot.latestWeight, { occurredOn: '2025-04-03', weightKg: 12.4 });
  assert.deepEqual(snapshot.healthHistory, [
    { type: 'Veterinärbesök', occurredOn: '2025-04-04', note: 'Checkup' },
    { type: 'Vaccination', occurredOn: '2025-04-01', note: 'Booster' },
  ]);
  assert.equal(snapshot.healthHistory.some(({ note }) => note === 'Not performed'), false);
});

test('newest weight and performed history use date descending then id descending for ties', () => {
  const snapshot = passport.createPassportSnapshot({
    dog, breedName: 'Beagle',
    weights: [weight('weight-a', '2025-04-03', 12.1), weight('weight-z', '2025-04-03', 12.9)],
    performedHistory: [health('health-a', 'vet_visit', '2025-04-04', 'Earlier id'), health('health-z', 'vaccination', '2025-04-04', 'Later id')],
    selection: profileSelection, createdOn: '2026-10-06',
  });
  assert.deepEqual(snapshot.latestWeight, { occurredOn: '2025-04-03', weightKg: 12.9 });
  assert.deepEqual(snapshot.healthHistory.map(({ note }) => note), ['Later id', 'Earlier id']);
});

test('health history is capped at the latest 50 loaded performed rows and the cap is explicit', () => {
  const performedHistory = Array.from({ length: 52 }, (_, index) => {
    const date = new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10);
    return health(`health-${String(index).padStart(2, '0')}`, index % 2 ? 'vaccination' : 'vet_visit', date, `Note ${index}`);
  });
  const snapshot = passport.createPassportSnapshot({ dog, breedName: 'Beagle', weights: [], performedHistory,
    selection: profileSelection, createdOn: '2026-10-06' });
  assert.equal(snapshot.healthHistory.length, passport.PASSPORT_HEALTH_ROW_LIMIT);
  assert.equal(snapshot.healthHistoryCapped, true);
  assert.equal(snapshot.healthHistory.some(({ note }) => note === 'Note 0' || note === 'Note 1'), false);
  const complete = passport.createPassportSnapshot({ dog, breedName: 'Beagle', weights: [], performedHistory: performedHistory.slice(0, 50),
    selection: profileSelection, createdOn: '2026-10-06' });
  assert.equal(complete.healthHistory.length, 50);
  assert.equal(complete.healthHistoryCapped, false);
});

test('selection toggles remove sections, and empty selected sections disclose their absence', () => {
  const noneSelected = passport.createPassportSnapshot({ dog, breedName: 'Beagle', weights: [], performedHistory: [],
    selection: { profile: false, latestWeight: false, healthHistory: false }, createdOn: '2026-10-06' });
  assert.equal(noneSelected.dog, null);
  assert.equal(noneSelected.latestWeight, null);
  assert.deepEqual(noneSelected.healthHistory, []);
  assert.match(passport.renderPassportHtml(noneSelected), /Inga avsnitt är valda/);

  const selectedButEmpty = passport.createPassportSnapshot({ dog, breedName: 'Beagle', weights: [], performedHistory: [],
    selection: { profile: false, latestWeight: true, healthHistory: true }, createdOn: '2026-10-06' });
  const html = passport.renderPassportHtml(selectedButEmpty);
  assert.match(html, /Ingen vikt har registrerats/);
  assert.match(html, /Ingen utförd hälsopost finns bland de inlästa uppgifterna/);
  assert.match(html, /Högst 50 senast inlästa poster visas; äldre uppgifter kan saknas/);
});

test('PDF HTML uses a local labelled illustration only when profile is selected', () => {
  const withProfile = passport.createPassportSnapshot({ dog, breedName: 'Beagle', weights: [], performedHistory: [],
    selection: { profile: true, latestWeight: false, healthHistory: false }, createdOn: '2026-10-06' });
  const withoutProfile = passport.createPassportSnapshot({ dog, breedName: 'Beagle', weights: [], performedHistory: [],
    selection: { profile: false, latestWeight: false, healthHistory: false }, createdOn: '2026-10-06' });
  const profileHtml = passport.renderPassportHtml(withProfile);
  const noProfileHtml = passport.renderPassportHtml(withoutProfile);
  assert.match(profileHtml, /Tassla-illustration/);
  assert.match(profileHtml, /<svg[^>]+class="tassla-illustration"/);
  assert.doesNotMatch(profileHtml, /https?:\/\//);
  assert.doesNotMatch(noProfileHtml, /Tassla-illustration/);
});

test('PassportScreen section toggles update the selected preview and are ignored while export is busy', () => {
  const source = extractLocalFunction(passportScreenSource, 'function toggleSelection(');
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  const build = (busy, state) => new Function('busy', 'setSelection', 'setStatusMessage',
    `${compiled}\nreturn toggleSelection;`)(busy, (update) => state.updates.push(update), (message) => state.messages.push(message));
  const state = { updates: [], messages: [] };
  build(false, state)('latestWeight');
  assert.deepEqual(state.updates[0]({ profile: true, latestWeight: true, healthHistory: false }), {
    profile: true, latestWeight: false, healthHistory: false,
  });
  assert.deepEqual(state.messages, ['']);
  build(true, state)('healthHistory');
  assert.equal(state.updates.length, 1);
  assert.deepEqual(state.messages, ['']);
});

test('snapshot is immutable and rendered PDF source is derived from the same captured values', () => {
  const originalWeight = weight('weight-1', '2025-04-03', 12.4);
  const originalHealth = health('health-1', 'vet_visit', '2025-04-04', 'Saved note');
  const weights = [originalWeight];
  const performedHistory = [originalHealth];
  const selection = { ...profileSelection };
  const snapshot = passport.createPassportSnapshot({ dog, breedName: 'Beagle', weights, performedHistory, selection, createdOn: '2026-10-06' });
  const htmlBefore = passport.renderPassportHtml(snapshot);
  originalWeight.weight_kg = 99;
  originalHealth.description = 'Later edit';
  weights.push(weight('weight-new', '2026-10-06', 15));
  selection.profile = false;
  assert.equal(passport.renderPassportHtml(snapshot), htmlBefore);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.selected), true);
  assert.equal(Object.isFrozen(snapshot.dog), true);
  assert.equal(Object.isFrozen(snapshot.latestWeight), true);
  assert.equal(Object.isFrozen(snapshot.healthHistory), true);
  assert.equal(Object.isFrozen(snapshot.healthHistory[0]), true);
  assert.match(htmlBefore, /12,4 kg/);
  assert.match(htmlBefore, /Saved note/);
  assert.doesNotMatch(htmlBefore, /Later edit|15 kg|99 kg/);
});

test('all owner-controlled profile, weight, history, and created-on strings are HTML escaped', () => {
  const hostileDog = { ...dog, name: `O'Reilly & <b>"Nala"</b>`, birth_date: `2023&<script>alert('x')</script>` };
  const hostileWeight = weight('weight-1', '2025-04-03&<', 12.4);
  const hostileHealth = health('health-1', 'vet_visit', '2025-04-04"', `& <img src=x onerror="alert('x')"> 'quote'`);
  const snapshot = passport.createPassportSnapshot({ dog: hostileDog, breedName: `Beagle & <img src=x onerror="x"> 'mix'`,
    weights: [hostileWeight], performedHistory: [hostileHealth], selection: profileSelection, createdOn: `2026&<script>alert('x')</script>` });
  const html = passport.renderPassportHtml(snapshot);
  for (const raw of [hostileDog.name, hostileDog.birth_date, `Beagle & <img src=x onerror="x"> 'mix'`, hostileWeight.occurred_on, hostileHealth.occurred_on, hostileHealth.description, `2026&<script>alert('x')</script>`]) {
    assert.equal(html.includes(raw), false, `raw HTML must not contain ${raw}`);
  }
  assert.match(html, /O&#39;Reilly &amp; &lt;b&gt;&quot;Nala&quot;&lt;\/b&gt;/);
  assert.match(html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script|<img|onerror=["']/i);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test('escaped HTML contains no remote assets, dynamic scripts, or external resource URLs', () => {
  const snapshot = passport.createPassportSnapshot({ dog, breedName: 'Beagle', weights: [], performedHistory: [],
    selection: { profile: true, latestWeight: false, healthHistory: false }, createdOn: '2026-10-06' });
  const html = passport.renderPassportHtml(snapshot);
  assert.doesNotMatch(html, /<script|<img|<iframe|<link\s|@import|https?:\/\//i);
  assert.match(html, /<meta charset="utf-8">/);
});

test('export shares the exact captured preview HTML and dialog close is not delivery confirmation', async () => {
  const snapshot = makeSnapshot();
  const expectedHtml = passport.renderPassportHtml(snapshot);
  const harness = createExporterHarness();
  const deps = dependencies(harness, { printToFileAsync: async ({ html }) => {
    harness.calls.push(['print', html]);
    return { uri: 'file:///cache/Print/print-temp.pdf', numberOfPages: 1 };
  } });
  const result = await harness.createAndSharePassportPdf(snapshot, () => true, deps);
  assert.deepEqual(result, { status: 'dialog-closed' });
  assert.deepEqual(harness.calls.map(([name]) => name), ['cleanup', 'print', 'move', 'available', 'share', 'delete', 'delete']);
  assert.equal(harness.calls.find(([name]) => name === 'print')[1], expectedHtml);
  assert.equal(harness.calls.find(([name]) => name === 'share')[1], 'file:///cache/tassla-passport-test-id.pdf');
  assert.equal('delivered' in result, false);
  assert.match(harness.calls.find(([name]) => name === 'share')[2].mimeType, /application\/pdf/);
});

test('duplicate PDF export is blocked while the first print is awaiting completion', async () => {
  const harness = createExporterHarness();
  let finishPrint;
  const deps = dependencies(harness, { printToFileAsync: () => new Promise((resolve) => { finishPrint = resolve; }) });
  const first = harness.createAndSharePassportPdf(makeSnapshot(), () => true, deps);
  await Promise.resolve();
  await Promise.resolve();
  const second = await harness.createAndSharePassportPdf(makeSnapshot(), () => true, deps);
  assert.deepEqual(second, { status: 'busy' });
  finishPrint({ uri: 'file:///cache/Print/print-temp.pdf', numberOfPages: 1 });
  assert.deepEqual(await first, { status: 'dialog-closed' });
  assert.equal(harness.calls.filter(([name]) => name === 'share').length, 1);
});

test('availability false and native failure clean every generated temp path and never report delivery', async (t) => {
  await t.test('sharing unavailable', async () => {
    const harness = createExporterHarness();
    const deps = dependencies(harness, { isAvailableAsync: async () => false });
    assert.deepEqual(await harness.createAndSharePassportPdf(makeSnapshot(), () => true, deps), { status: 'unavailable' });
    assert.equal(harness.calls.some(([name]) => name === 'share'), false);
    assert.deepEqual(harness.calls.filter(([name]) => name === 'delete').map(([, uri]) => uri), [
      'file:///cache/Print/print-temp.pdf', 'file:///cache/tassla-passport-test-id.pdf',
    ]);
  });
  await t.test('print rejection', async () => {
    const harness = createExporterHarness();
    const deps = dependencies(harness, { printToFileAsync: async () => { throw new Error('print failed'); } });
    assert.deepEqual(await harness.createAndSharePassportPdf(makeSnapshot(), () => true, deps), { status: 'failed' });
    assert.equal(harness.calls.some(([name]) => name === 'delete'), false);
  });
  await t.test('owned-file move rejection cleans the generated nested Print file', async () => {
    const harness = createExporterHarness();
    const deps = dependencies(harness, { moveOwnedFile: async () => { throw new Error('move failed'); } });
    assert.deepEqual(await harness.createAndSharePassportPdf(makeSnapshot(), () => true, deps), { status: 'failed' });
    assert.deepEqual(harness.calls.filter(([name]) => name === 'delete').map(([, uri]) => uri), ['file:///cache/Print/print-temp.pdf']);
    assert.equal(harness.calls.some(([name]) => name === 'share'), false);
  });
  await t.test('share rejection', async () => {
    const harness = createExporterHarness();
    const deps = dependencies(harness, { shareAsync: async () => { throw new Error('share failed'); } });
    assert.deepEqual(await harness.createAndSharePassportPdf(makeSnapshot(), () => true, deps), { status: 'failed' });
    assert.equal(harness.calls.filter(([name]) => name === 'delete').length, 2);
    assert.equal(harness.calls.some(([name, value]) => name === 'status' && value === 'delivered'), false);
  });
});

test('account or dog lifetime change after each asynchronous boundary suppresses share and cleans owned temp files', async (t) => {
  await t.test('stale after PDF creation', async () => {
    const harness = createExporterHarness();
    let checks = 0;
    const deps = dependencies(harness);
    const result = await harness.createAndSharePassportPdf(makeSnapshot(), () => ++checks < 2, deps);
    assert.deepEqual(result, { status: 'stale' });
    assert.equal(harness.calls.some(([name]) => name === 'share'), false);
    assert.equal(harness.calls.filter(([name]) => name === 'delete').length, 1);
  });
  await t.test('stale after availability await', async () => {
    const harness = createExporterHarness();
    let current = true;
    const deps = dependencies(harness, { isAvailableAsync: async () => { current = false; return true; } });
    const result = await harness.createAndSharePassportPdf(makeSnapshot(), () => current, deps);
    assert.deepEqual(result, { status: 'stale' });
    assert.equal(harness.calls.some(([name]) => name === 'share'), false);
    assert.equal(harness.calls.filter(([name]) => name === 'delete').length, 2);
  });
  await t.test('immediately-before-share guard', async () => {
    const harness = createExporterHarness();
    let checks = 0;
    const deps = dependencies(harness);
    const result = await harness.createAndSharePassportPdf(makeSnapshot(), () => ++checks < 5, deps);
    assert.deepEqual(result, { status: 'stale' });
    assert.equal(harness.calls.some(([name]) => name === 'share'), false);
    assert.equal(harness.calls.filter(([name]) => name === 'delete').length, 2);
  });
});

test('startup cleanup deletes only stale direct-cache files with the owned prefix and preserves active files', () => {
  assert.match(appFlowSource, /useEffect\(\(\) => \{[\s\S]*?cleanupStalePassportFiles\(\);/,
    'AppFlow startup must invoke cleanup independently of local/remote branches');
  const harness = createExporterHarness();
  const removed = [];
  class FakeFile {
    constructor(uri, name = uri.split('/').at(-1)) { this.uri = uri; this.name = name; }
    delete() { removed.push(this.uri); }
  }
  const active = new FakeFile('file:///cache/tassla-passport-active.pdf');
  harness.activeOwnedFiles.add(active.uri);
  const prefixedStale = new FakeFile('file:///cache/tassla-passport-old.pdf');
  const unrelated = new FakeFile('file:///cache/other-export.pdf');
  const directory = { uri: 'file:///cache/folder', name: 'folder', delete() { removed.push(this.uri); } };
  harness.setCleanupEnvironment({ cache: { exists: true, list: () => [prefixedStale, active, unrelated, directory] } }, FakeFile);
  harness.cleanupStalePassportFiles();
  assert.deepEqual(removed, [prefixedStale.uri]);
});

test('actual Expo adapter moves realistic cache/Print output into its owned cache-root path', async () => {
  const method = extractMethod(exporterSource, 'async moveOwnedFile(uri, name)');
  const generatedValidator = extractLocalFunction(exporterSource, 'function isGeneratedPrintFile(');
  class FakeFile {
    constructor(path, name) {
      this.uri = name ? `${path.uri.replace(/\/$/, '')}/${name}` : path;
      this.name = this.uri.split('/').at(-1);
      this.parentDirectory = { uri: this.uri.includes('/Print/') ? 'file:///cache/Print/' : 'file:///cache/' };
      this.exists = this.uri === 'file:///cache/Print/print.pdf';
    }
    async move(target) { target.exists = true; this.exists = false; }
    delete() { this.exists = false; }
  }
  class FakeDirectory {
    constructor(path, name) { this.uri = `${path.uri.replace(/\/$/, '')}/${name}/`; }
  }
  const cache = { uri: 'file:///cache/' };
  const compiled = ts.transpileModule(`
    const PASSPORT_EXPORT_PREFIX = 'tassla-passport-';
    ${generatedValidator}
    const adapter = { ${method} };
    return adapter.moveOwnedFile;
  `, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  const moveOwnedFile = new Function('File', 'Directory', 'Paths', compiled)(
    FakeFile,
    FakeDirectory,
    { cache },
  );
  const result = await moveOwnedFile('file:///cache/Print/print.pdf', 'tassla-passport-realistic.pdf');
  assert.equal(result, 'file:///cache/tassla-passport-realistic.pdf');
  assert.match(result.slice(result.lastIndexOf('/') + 1), /^tassla-passport-/);
});

test('unexpected print URIs fail closed without move, share, or deleting unowned paths', async (t) => {
  for (const uri of [
    'file:///cache/ordinary.pdf',
    'file:///cache/Other/print.pdf',
    'https://example.org/remote.pdf',
  ]) {
    await t.test(uri, async () => {
      const harness = createExporterHarness();
      const deps = dependencies(harness, { printToFileAsync: async () => ({ uri, numberOfPages: 1 }) });
      assert.deepEqual(await harness.createAndSharePassportPdf(makeSnapshot(), () => true, deps), { status: 'failed' });
      assert.equal(harness.calls.some(([name]) => name === 'move' || name === 'share' || name === 'delete'), false);
    });
  }
});

test('unexpected move destinations fail closed and are never shared or deleted as owned files', async () => {
  const harness = createExporterHarness();
  const unexpected = 'file:///cache/other.pdf';
  const deps = dependencies(harness, {
    moveOwnedFile: async () => { harness.calls.push(['move', 'file:///cache/Print/print-temp.pdf', 'tassla-passport-test-id.pdf']); return unexpected; },
    isOwnedPassportFile: () => false,
  });
  assert.deepEqual(await harness.createAndSharePassportPdf(makeSnapshot(), () => true, deps), { status: 'failed' });
  assert.equal(harness.calls.some(([name]) => name === 'share'), false);
  assert.deepEqual(harness.calls.filter(([name]) => name === 'delete').map(([, uri]) => uri), ['file:///cache/Print/print-temp.pdf']);
});

test('export startup actually runs stale owned-file cleanup before printing', async () => {
  const harness = createExporterHarness();
  const removed = [];
  class FakeFile {
    constructor(uri) { this.uri = uri; this.name = uri.split('/').at(-1); }
    delete() { removed.push(this.uri); }
  }
  const stale = new FakeFile('file:///cache/tassla-passport-stale.pdf');
  harness.setCleanupEnvironment({ cache: { uri: 'file:///cache', exists: true, list: () => [stale] } }, FakeFile);
  const deps = dependencies(harness);
  assert.deepEqual(await harness.createAndSharePassportPdf(makeSnapshot(), () => true, deps), { status: 'dialog-closed' });
  assert.deepEqual(removed, [stale.uri]);
  assert.equal(harness.calls[0][0], 'cleanup');
});

test('PassportScreen export handler captures the current preview on user action and blocks duplicates', async () => {
  assert.match(passportScreenSource, /onPress=\{\(\) => \{ void createAndShare\(\); \}\}/);
  assert.match(passportScreenSource, /disabled=\{!ready \|\| !snapshot \|\| busy \|\| !selectedAny\}/);
  const source = extractLocalFunction(passportScreenSource, 'async function createAndShare()');
  let completeExport;
  const calls = [];
  const state = { exporting: [], exportingSnapshot: [], messages: [], errors: [] };
  const operationInFlight = { current: false };
  const original = makeSnapshot();
  let current = true;
  const handler = buildScreenHandler({ source, operationInFlight, snapshot: original, current: () => current,
    state, exportResult: () => new Promise((resolve) => { completeExport = resolve; }) });

  const first = handler();
  const duplicate = handler();
  await duplicate;
  assert.equal(calls.length, 0); // The injected exporter has not resolved yet.
  assert.equal(state.exporting[0], true);
  assert.deepEqual(state.exportingSnapshot[0], { ...original, createdOn: '2026-10-06' });
  assert.equal(Object.isFrozen(state.exportingSnapshot[0]), true);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(completeExport instanceof Function, true);
  completeExport({ status: 'dialog-closed' });
  await first;
  assert.equal(operationInFlight.current, false);
  assert.equal(state.messages[0], 'Delningsdialogen har stängts. Tassla kan inte se om eller till vem filen delades.');
  assert.equal(state.messages.some((message) => /levererad|mottagare har fått/i.test(message)), false);
  assert.deepEqual(state.exporting, [true, false]);
  assert.deepEqual(state.exportingSnapshot, [{ ...original, createdOn: '2026-10-06' }, null]);
});

test('PassportScreen suppresses late state updates after its captured account/dog lifetime changes', async () => {
  const source = extractLocalFunction(passportScreenSource, 'async function createAndShare()');
  let completeExport;
  const state = { exporting: [], exportingSnapshot: [], messages: [], errors: [] };
  const operationInFlight = { current: false };
  let current = true;
  const handler = buildScreenHandler({ source, operationInFlight, snapshot: makeSnapshot(), current: () => current,
    state, exportResult: () => new Promise((resolve) => { completeExport = resolve; }) });
  const active = handler();
  await new Promise((resolve) => setTimeout(resolve, 0));
  current = false;
  completeExport({ status: 'dialog-closed' });
  await active;
  assert.deepEqual(state.messages, []);
  assert.deepEqual(state.exporting, [true]);
  assert.deepEqual(state.exportingSnapshot.length, 1);
  assert.equal(operationInFlight.current, false);
});

test('PDF snapshot uses the exact currently previewed created-on date across midnight', async () => {
  const source = extractLocalFunction(passportScreenSource, 'async function createAndShare()');
  const state = { exporting: [], exportingSnapshot: [], messages: [], errors: [] };
  const operationInFlight = { current: false };
  const previewSnapshot = Object.freeze({ ...makeSnapshot(), createdOn: '2026-10-05' });
  const handler = buildScreenHandler({ source, operationInFlight, snapshot: previewSnapshot, current: () => true,
    state, exportResult: async () => ({ status: 'dialog-closed' }) });
  await handler();
  assert.equal(state.captured, previewSnapshot, 'export should receive the exact immutable preview snapshot');
  assert.equal(state.captured.createdOn, '2026-10-05');
  assert.equal(passport.renderPassportHtml(state.captured), passport.renderPassportHtml(previewSnapshot));
});

function weight(id, occurred_on, weight_kg) {
  return { id, dog_id: dog.id, actor_id: 'owner-id', occurred_on, weight_kg };
}

function health(id, event_type, occurred_on, description) {
  return { id, dog_id: dog.id, actor_id: 'owner-id', event_type, occurred_on, description };
}

function makeSnapshot() {
  return passport.createPassportSnapshot({
    dog, breedName: 'Beagle', weights: [weight('weight-1', '2026-10-05', 12.4)],
    performedHistory: [health('health-1', 'vaccination', '2026-10-04', 'Booster')],
    selection: profileSelection, createdOn: '2026-10-06',
  });
}

function createExporterHarness() {
  const createFunction = extractExportedFunction(exporterSource, 'createAndSharePassportPdf');
  const cleanupFunction = extractExportedFunction(exporterSource, 'cleanupStalePassportFiles');
  const calls = [];
  const program = `
    const PASSPORT_EXPORT_PREFIX = 'tassla-passport-';
    let exportInFlight = false;
    const activeOwnedFiles = new Set();
    const passportExportDependencies = {};
    let cache = { uri: 'file:///cache', exists: true, list: () => [] };
    let File = class {};
    const Paths = { get cache() { return cache; } };
    ${cleanupFunction}
    ${createFunction}
    return { createAndSharePassportPdf, cleanupStalePassportFiles, activeOwnedFiles,
      setCleanupEnvironment(value, FileValue) { cache = value.cache; File = FileValue; } };
  `;
  const transpiled = ts.transpileModule(program, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  const build = new Function('renderPassportHtml', transpiled);
  const harness = build(passport.renderPassportHtml);
  harness.calls = calls;
  return harness;
}

function dependencies(harness, overrides = {}) {
  return {
    cleanupStaleFiles: overrides.cleanupStaleFiles ?? (() => {
      harness.calls.push(['cleanup']);
      harness.cleanupStalePassportFiles();
    }),
    printToFileAsync: overrides.printToFileAsync ?? (async ({ html }) => {
      harness.calls.push(['print', html]);
      return { uri: 'file:///cache/Print/print-temp.pdf', numberOfPages: 1 };
    }),
    isGeneratedPrintFile: overrides.isGeneratedPrintFile ?? ((uri) => uri.startsWith('file:///cache/Print/')),
    isOwnedPassportFile: overrides.isOwnedPassportFile ?? ((uri, name) => uri === `file:///cache/${name}` && name.startsWith('tassla-passport-')),
    moveOwnedFile: overrides.moveOwnedFile ?? (async (uri, name) => {
      harness.calls.push(['move', uri, name]);
      return `file:///cache/${name}`;
    }),
    isAvailableAsync: overrides.isAvailableAsync ?? (async () => {
      harness.calls.push(['available']);
      return true;
    }),
    shareAsync: overrides.shareAsync ?? (async (uri, options) => {
      harness.calls.push(['share', uri, options]);
    }),
    deleteFile: overrides.deleteFile ?? ((uri) => { harness.calls.push(['delete', uri]); }),
    randomId: overrides.randomId ?? (() => 'test-id'),
  };
}

function extractExportedFunction(source, name) {
  let start = source.indexOf(`export async function ${name}(`);
  if (start === -1) start = source.indexOf(`export function ${name}(`);
  assert.notEqual(start, -1, `expected actual export workflow function ${name}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = bodyStart; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return source.slice(start, i + 1).replace(/^export\s+/, '');
  }
  assert.fail(`unterminated actual export function ${name}`);
}

function extractMethod(source, signature) {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `expected actual adapter method ${signature}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = bodyStart; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  assert.fail(`unterminated adapter method ${signature}`);
}

function extractLocalFunction(source, signature) {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `expected actual screen handler ${signature}`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = bodyStart; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  assert.fail(`unterminated actual screen handler ${signature}`);
}

function buildScreenHandler({ source, operationInFlight, snapshot, current, state, exportResult }) {
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  const createAndSharePassportPdf = async (captured, isCurrent) => {
    state.captured = captured;
    state.currentPredicate = isCurrent;
    return exportResult();
  };
  const exportMessage = (result) => {
    if (result.status === 'dialog-closed') return { text: 'Delningsdialogen har stängts. Tassla kan inte se om eller till vem filen delades.', error: false };
    return { text: 'Export error', error: true };
  };
  const localDate = () => '2026-10-06';
  const factory = new Function('operationInFlight', 'snapshot', 'ready', 'localDate', 'setExporting', 'setExportingSnapshot',
    'setStatusMessage', 'setStatusError', 'currentLifetime', 'isCurrent', 'createAndSharePassportPdf', 'exportMessage',
    `${compiled}\nreturn createAndShare;`);
  return factory(operationInFlight, snapshot, true, localDate, (value) => state.exporting.push(value),
    (value) => state.exportingSnapshot.push(value), (value) => { if (value) state.messages.push(value); },
    (value) => state.errors.push(value), 'dog-session-1', (lifetime) => current() && lifetime === 'dog-session-1',
    createAndSharePassportPdf, exportMessage);
}
