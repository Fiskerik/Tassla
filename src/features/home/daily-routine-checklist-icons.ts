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
export type DailyRoutineChecklistDisplayIcon = DailyRoutineChecklistIcon | 'list-outline';
export type DailyRoutineChecklistIconTone = 'water' | 'walk' | 'sleep' | 'food' | 'vaccination' | 'veterinary' | 'training' | 'neutral';

const DAILY_ROUTINE_CHECKLIST_ICON_TONES: Record<DailyRoutineChecklistDisplayIcon, DailyRoutineChecklistIconTone> = {
  paw: 'neutral',
  'water-outline': 'water',
  'walk-outline': 'walk',
  'bed-outline': 'sleep',
  'sunny-outline': 'neutral',
  'leaf-outline': 'neutral',
  'heart-outline': 'neutral',
  'flower-outline': 'neutral',
  'brush-outline': 'neutral',
  'bandage-outline': 'vaccination',
  'medkit-outline': 'veterinary',
  'restaurant-outline': 'food',
  'moon-outline': 'sleep',
  'football-outline': 'neutral',
  'fitness-outline': 'training',
  'sparkles-outline': 'neutral',
  'home-outline': 'neutral',
  'school-outline': 'training',
  'rose-outline': 'neutral',
  'star-outline': 'neutral',
  'list-outline': 'neutral',
};

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

const LEGACY_ICON_TOKENS: Readonly<Record<DailyRoutineChecklistIcon, readonly string[]>> = {
  paw: ['tass', 'tassar'],
  'water-outline': ['vatten', 'dricka'],
  'walk-outline': ['promenad', 'runda', 'rast', 'koppel'],
  'bed-outline': ['vila', 'sova', 'sömn'],
  'sunny-outline': [],
  'leaf-outline': [],
  'heart-outline': [],
  'flower-outline': [],
  'brush-outline': ['borsta', 'kamma', 'pälsvård'],
  'bandage-outline': [],
  'medkit-outline': ['medicin', 'veterinär', 'vaccin'],
  'restaurant-outline': ['mat', 'måltid', 'foder', 'äta'],
  'moon-outline': [],
  'football-outline': ['lek', 'leka', 'boll'],
  'fitness-outline': ['träning', 'träna', 'övning', 'miljöträning'],
  'sparkles-outline': [],
  'home-outline': ['hemma', 'hem'],
  'school-outline': [],
  'rose-outline': [],
  'star-outline': [],
};

export function isDailyRoutineChecklistIcon(value: unknown): value is DailyRoutineChecklistIcon {
  return typeof value === 'string' && iconSet.has(value);
}

export function suggestDailyRoutineChecklistIcon(label: string): DailyRoutineChecklistIcon | null {
  const tokens = new Set(label.toLowerCase().match(/\p{L}+/gu) ?? []);
  const matches = DAILY_ROUTINE_CHECKLIST_ICONS.filter((icon) => LEGACY_ICON_TOKENS[icon].some((token) => tokens.has(token)));
  return matches.length === 1 ? matches[0] : null;
}

export function dailyRoutineChecklistDisplayIcon(item: { label: string; icon?: DailyRoutineChecklistIcon }): DailyRoutineChecklistDisplayIcon {
  if (isDailyRoutineChecklistIcon(item.icon)) return item.icon;
  return suggestDailyRoutineChecklistIcon(item.label) ?? 'list-outline';
}

export function dailyRoutineChecklistIconTone(icon: DailyRoutineChecklistDisplayIcon): DailyRoutineChecklistIconTone {
  return DAILY_ROUTINE_CHECKLIST_ICON_TONES[icon];
}
