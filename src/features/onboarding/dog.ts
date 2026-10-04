export interface Dog {
  id: string;
  name: string;
  breedId: string;
  birthDate: string;
}

export function ageInWeeks(birthDate: string, today: string): number {
  const birth = parseDate(birthDate);
  const current = parseDate(today);
  if (birth > current) throw new Error('Birth date cannot be in the future');
  return Math.floor((current - birth) / (7 * 86_400_000));
}

export function localDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Expected YYYY-MM-DD');
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) {
    throw new Error('Invalid calendar date');
  }
  return time;
}
