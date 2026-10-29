import { createClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'node:url';

const fields = {
  cohort_size: 'Uppmätt kohort',
  referral: 'Observerad referens',
  dog_created: 'Hund skapad',
  home_viewed: 'Hem visad efter hundprofil',
  first_value: 'Första nytta',
  d1: 'Återkomst D1',
  d7: 'Återkomst D7',
};

export function defaultCohortRange(now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const date = days => new Date(today - days * 86_400_000).toISOString().slice(0, 10);
  return [date(21), date(9)];
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export async function readTractionReport(client, from, to) {
  if (!validDate(from) || !validDate(to) || from > to) throw new Error('Invalid dates');
  const { data, error } = await client.rpc('beta_traction_report', { p_from: from, p_to: to });
  if (error || !Array.isArray(data) || data.length !== 1 || !data[0] || typeof data[0] !== 'object') throw new Error('Invalid report');
  const row = data[0];
  const keys = Object.keys(fields);
  if (Object.keys(row).length !== keys.length || keys.some(key => !Object.hasOwn(row, key))) throw new Error('Invalid report');
  const result = {};
  for (const key of keys) {
    const value = row[key];
    if (value === null) { result[key] = null; continue; }
    if (!(typeof value === 'number' || (typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value)))) throw new Error('Invalid report');
    const count = Number(value);
    if (!Number.isSafeInteger(count) || count < 5) throw new Error('Invalid report');
    result[key] = count;
  }
  if (result.cohort_size === null && keys.some(key => result[key] !== null)) throw new Error('Invalid report');
  if (result.cohort_size !== null && keys.some(key => result[key] !== null && result[key] > result.cohort_size)) throw new Error('Invalid report');
  return result;
}

export function formatTractionReport(report, from, to) {
  return [
    `Startdatum för uppmätt kohort (UTC): ${from}–${to}`,
    ...Object.entries(fields).map(([key, label]) => `${label}: ${report[key] === null ? 'undertryckt' : report[key]}`),
    'Endast deltagare med aktivt samtycke ingår; referenser är inte anonyma QR-skanningar.',
    'D1: 24–48 timmar; D7: 168–192 timmar efter första uppmätta onboarding.',
    'Små värden undertrycks. Rapporten är inte anonymiserad.',
  ].join('\n');
}

export async function runReportCli({ args, env, writeOut, writeError, makeClient = createClient }) {
  try {
    if (args.length !== 0 && args.length !== 2) throw new Error('Invalid arguments');
    const [from, to] = args.length ? args : defaultCohortRange();
    const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = env;
    if (!url || !key) throw new Error('Missing configuration');
    const client = makeClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const report = await readTractionReport(client, from, to);
    writeOut(`${formatTractionReport(report, from, to)}\n`);
    return 0;
  } catch {
    writeError('Kunde inte hämta rapporten. Kontrollera miljövariabler, anslutning och datumintervallet.\n');
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await runReportCli({ args: process.argv.slice(2), env: process.env, writeOut: text => process.stdout.write(text), writeError: text => process.stderr.write(text) });
}
