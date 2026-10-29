import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultCohortRange, readTractionReport, formatTractionReport, runReportCli } from '../tools/traction-report.mjs';

const row = { cohort_size: '8', referral: null, dog_created: 7, home_viewed: 6, first_value: 5, d1: null, d7: null };

test('default range uses UTC dates across year boundaries', () => {
  assert.deepEqual(defaultCohortRange(new Date('2027-01-02T01:00:00+02:00')), ['2026-12-11', '2026-12-23']);
});

test('report requests only aggregate function and formats suppressed values', async () => {
  const calls = [];
  const result = await readTractionReport({ rpc: async (...args) => { calls.push(args); return { data: [row], error: null }; } }, '2026-10-06', '2026-10-18');
  assert.deepEqual(calls, [['beta_traction_report', { p_from: '2026-10-06', p_to: '2026-10-18' }]]);
  assert.equal(result.cohort_size, 8);
  assert.match(formatTractionReport(result, '2026-10-06', '2026-10-18'), /Observerad referens: undertryckt/);
});

test('rejects invalid dates and unexpected or unsuppressed data', async () => {
  const client = data => ({ rpc: async () => ({ data, error: null }) });
  await assert.rejects(readTractionReport(client([row]), '2026-02-30', '2026-03-01'));
  await assert.rejects(readTractionReport(client([row]), '2026-10-19', '2026-10-18'));
  await assert.rejects(readTractionReport(client([{ ...row, user_id: 'private' }]), '2026-10-06', '2026-10-18'));
  await assert.rejects(readTractionReport(client([{ ...row, d1: 3 }]), '2026-10-06', '2026-10-18'));
  await assert.rejects(readTractionReport(client([{ ...row, cohort_size: null }]), '2026-10-06', '2026-10-18'));
  await assert.rejects(readTractionReport(client([{ ...row, d1: 9 }]), '2026-10-06', '2026-10-18'));
  await assert.rejects(readTractionReport({ rpc: async () => ({ error: { message: 'private server detail' } }) }, '2026-10-06', '2026-10-18'), /Invalid report/);
});

test('CLI failure never prints supplied credentials or server errors', async () => {
  const secret = 'test-service-secret-123';
  let output = '';
  const status = await runReportCli({ args: ['2026-10-06', '2026-10-18'], env: { SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: secret }, writeOut: text => { output += text; }, writeError: text => { output += text; }, makeClient: () => ({ rpc: async () => { throw new Error(`private ${secret}`); } }) });
  assert.equal(status, 1);
  assert.doesNotMatch(output, /test-service-secret-123|example\.invalid|private/);
  assert.match(output, /Kunde inte hämta rapporten/);
});
