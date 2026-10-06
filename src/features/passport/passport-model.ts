import type { OwnedDog } from '../../data/app-data';
import type { HealthHistoryRecord, HealthWeightRecord } from '../../data/workspace-data';

export const PASSPORT_HEALTH_ROW_LIMIT = 50;

export interface PassportSelection {
  readonly profile: boolean;
  readonly latestWeight: boolean;
  readonly healthHistory: boolean;
}

export interface PassportSnapshot {
  readonly createdOn: string;
  readonly selected: PassportSelection;
  readonly dog: Readonly<{ name: string; breed: string; birthDate: string }> | null;
  readonly latestWeight: Readonly<{ occurredOn: string; weightKg: number }> | null;
  readonly healthHistory: readonly Readonly<{
    type: 'Vaccination' | 'Veterinärbesök';
    occurredOn: string;
    note: string | null;
  }>[];
  readonly healthHistoryCapped: boolean;
}

export function createPassportSnapshot(input: {
  dog: OwnedDog;
  breedName: string | null;
  weights: readonly HealthWeightRecord[];
  performedHistory: readonly HealthHistoryRecord[];
  selection: PassportSelection;
  createdOn: string;
}): PassportSnapshot {
  const selected = Object.freeze({ ...input.selection });
  const dog = input.selection.profile && input.breedName
    ? Object.freeze({ name: input.dog.name, breed: input.breedName, birthDate: input.dog.birth_date })
    : null;
  const latestWeight = input.selection.latestWeight
    ? [...input.weights]
      .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on) || b.id.localeCompare(a.id))
      .slice(0, 1)
      .map(({ occurred_on, weight_kg }) => Object.freeze({ occurredOn: occurred_on, weightKg: weight_kg }))[0] ?? null
    : null;
  const sortedHistory = [...input.performedHistory]
    .filter((row) => row.event_type === 'vaccination' || row.event_type === 'vet_visit')
    .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on) || b.id.localeCompare(a.id));
  const limitedHistory = input.selection.healthHistory ? sortedHistory.slice(0, PASSPORT_HEALTH_ROW_LIMIT) : [];
  const healthHistory = Object.freeze(limitedHistory.map((row) => Object.freeze({
    type: row.event_type === 'vaccination' ? 'Vaccination' as const : 'Veterinärbesök' as const,
    occurredOn: row.occurred_on,
    note: row.description,
  })));

  return Object.freeze({
    createdOn: input.createdOn,
    selected,
    dog,
    latestWeight,
    healthHistory,
    healthHistoryCapped: input.selection.healthHistory && sortedHistory.length > PASSPORT_HEALTH_ROW_LIMIT,
  });
}

export function escapePassportHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

export function renderPassportHtml(snapshot: PassportSnapshot): string {
  const sections: string[] = [];
  if (snapshot.selected.profile) {
    sections.push(`<section><h2>Hund</h2>${snapshot.dog
      ? `<dl><dt>Namn</dt><dd>${escapePassportHtml(snapshot.dog.name)}</dd><dt>Ras</dt><dd>${escapePassportHtml(snapshot.dog.breed)}</dd><dt>Född</dt><dd>${escapePassportHtml(snapshot.dog.birthDate)}</dd></dl>`
      : '<p>Hunduppgifter saknas.</p>'}</section>`);
  }
  if (snapshot.selected.latestWeight) {
    const value = snapshot.latestWeight
      ? `<p><strong>${escapePassportHtml(snapshot.latestWeight.weightKg.toLocaleString('sv-SE', { maximumFractionDigits: 3 }))} kg</strong> · ${escapePassportHtml(snapshot.latestWeight.occurredOn)}</p>`
      : '<p>Ingen vikt har registrerats.</p>';
    sections.push(`<section><h2>Senaste registrerade vikt</h2>${value}<p class="note">Ägarregistrerad uppgift.</p></section>`);
  }
  if (snapshot.selected.healthHistory) {
    const rows = snapshot.healthHistory.length === 0
      ? '<p>Ingen utförd hälsopost finns bland de inlästa uppgifterna.</p>'
      : `<ul>${snapshot.healthHistory.map((row) => `<li><strong>${escapePassportHtml(row.type)}</strong> · ${escapePassportHtml(row.occurredOn)}<br>${escapePassportHtml(row.note || 'Ingen anteckning har lagts till.')}</li>`).join('')}</ul>`;
    sections.push(`<section><h2>Utförda hälsoposter</h2>${rows}<p class="note">Ägarregistrerade uppgifter. Högst 50 senast inlästa poster visas; äldre uppgifter kan saknas.</p></section>`);
  }
  if (sections.length === 0) sections.push('<p>Inga avsnitt är valda.</p>');
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tassla-pass</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#1C3027;margin:32px;line-height:1.45}h1{font-size:28px}h2{font-size:19px;color:#186A4D;margin:0 0 12px}section{border:1px solid #D9DFD7;border-radius:14px;padding:16px;margin:16px 0}dl{display:grid;grid-template-columns:100px 1fr;gap:7px}dt,.note,footer{color:#536257}.note{font-size:12px}ul{padding-left:22px}li{margin:0 0 12px}footer{margin-top:24px;font-size:12px}</style></head><body><h1>Tassla-pass</h1>${sections.join('')}<footer>Skapad ${escapePassportHtml(snapshot.createdOn)} · Uppgifterna är registrerade av hundägaren. Detta är ingen officiell journal, legitimation eller vaccinationshandling.</footer></body></html>`;
}
