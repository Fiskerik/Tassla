export const DAILY_ROUTINE_CHECKLIST_ICONS = [
  'paw',
  'water-outline',
  'walk-outline',
  'bed-outline',
  'sunny-outline',
  'leaf-outline',
  'heart-outline',
  'flower-outline',
  'brush-outline',
  'bandage-outline',
  'medkit-outline',
  'restaurant-outline',
  'moon-outline',
  'football-outline',
  'fitness-outline',
  'sparkles-outline',
  'home-outline',
  'school-outline',
  'rose-outline',
  'star-outline',
] as const;

export type DailyRoutineChecklistIcon = (typeof DAILY_ROUTINE_CHECKLIST_ICONS)[number];

export const DAILY_ROUTINE_CHECKLIST_ICON_LABELS: Record<DailyRoutineChecklistIcon, string> = {
  paw: 'Tass',
  'water-outline': 'Vatten',
  'walk-outline': 'Promenad',
  'bed-outline': 'Vila',
  'sunny-outline': 'Sol',
  'leaf-outline': 'Natur',
  'heart-outline': 'Hjärta',
  'flower-outline': 'Blomma',
  'brush-outline': 'Pälsvård',
  'bandage-outline': 'Första hjälpen',
  'medkit-outline': 'Hälsa',
  'restaurant-outline': 'Mat',
  'moon-outline': 'Kväll',
  'football-outline': 'Lek',
  'fitness-outline': 'Träning',
  'sparkles-outline': 'Skötsel',
  'home-outline': 'Hemma',
  'school-outline': 'Lärande',
  'rose-outline': 'Doft',
  'star-outline': 'Favorit',
};

const iconSet: ReadonlySet<string> = new Set(DAILY_ROUTINE_CHECKLIST_ICONS);

export function isDailyRoutineChecklistIcon(value: unknown): value is DailyRoutineChecklistIcon {
  return typeof value === 'string' && iconSet.has(value);
}

export function assignDailyRoutineChecklistIcons<T extends { id: string; icon?: DailyRoutineChecklistIcon }>(
  items: readonly T[],
): DailyRoutineChecklistIcon[] {
  const used = new Set<DailyRoutineChecklistIcon>();
  return items.map((item, index) => {
    if (isDailyRoutineChecklistIcon(item.icon)) {
      used.add(item.icon);
      return item.icon;
    }
    const first = hash(item.id) % DAILY_ROUTINE_CHECKLIST_ICONS.length;
    for (let offset = 0; offset < DAILY_ROUTINE_CHECKLIST_ICONS.length; offset += 1) {
      const candidate = DAILY_ROUTINE_CHECKLIST_ICONS[(first + offset + index) % DAILY_ROUTINE_CHECKLIST_ICONS.length];
      if (!used.has(candidate)) {
        used.add(candidate);
        return candidate;
      }
    }
    return DAILY_ROUTINE_CHECKLIST_ICONS[(first + index) % DAILY_ROUTINE_CHECKLIST_ICONS.length];
  });
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  }
  return result >>> 0;
}
