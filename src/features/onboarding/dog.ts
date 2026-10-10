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

export function formatDogAge(birthDate: string, today: string): string {
  const birth = parseDate(birthDate);
  const current = parseDate(today);
  if (birth > current) throw new Error('Birth date cannot be in the future');

  const birthDateValue = new Date(birth);
  const currentDate = new Date(current);
  let months = (currentDate.getUTCFullYear() - birthDateValue.getUTCFullYear()) * 12
    + currentDate.getUTCMonth() - birthDateValue.getUTCMonth();
  if (currentDate.getUTCDate() < birthDateValue.getUTCDate()) months -= 1;

  if (months < 12) return `${months} mån`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${years} år ${remainingMonths} mån`;
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
