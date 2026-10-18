import type { IconCategory } from '../../components/ui/IconChip';

const routineIconAliases: Readonly<Record<string, IconCategory>> = {
  kiss: 'pee',
  kissa: 'pee',
  kisspaus: 'pee',
  bajs: 'poop',
  bajsa: 'poop',
  mat: 'food',
  äta: 'food',
  mata: 'food',
  måltid: 'food',
  sömn: 'sleep',
  sova: 'sleep',
  vila: 'sleep',
  promenad: 'walk',
  'gå ut': 'walk',
  vatten: 'water',
  dricka: 'water',
};

export function normalizeRoutineIconLabel(label: string): string {
  return label.trim().normalize('NFC').toLocaleLowerCase('sv-SE').replace(/\s+/gu, ' ');
}

export function routineIconCategory(label: string): IconCategory | null {
  return routineIconAliases[normalizeRoutineIconLabel(label)] ?? null;
}

export type UpcomingPreview<T> = { rows: readonly T[]; total: number; hasMore: boolean };

export function selectUpcomingWeekPreview<T extends { dateKey: string }>(
  rows: readonly T[],
  todayKey: string,
  weekEndKey: string,
  limit = 3,
): UpcomingPreview<T> {
  const matching = rows.filter((row) => row.dateKey > todayKey && row.dateKey <= weekEndKey);
  const safeLimit = Math.max(0, Math.floor(limit));
  return { rows: matching.slice(0, safeLimit), total: matching.length, hasMore: matching.length > safeLimit };
}
