export const CHECKLIST_ICONS = [
  'paw', 'water-outline', 'walk-outline', 'bed-outline', 'sunny-outline', 'leaf-outline', 'heart-outline',
  'flower-outline', 'brush-outline', 'bandage-outline', 'medkit-outline', 'restaurant-outline', 'moon-outline',
  'football-outline', 'fitness-outline', 'sparkles-outline', 'home-outline', 'school-outline', 'rose-outline', 'star-outline',
] as const;

export type ChecklistIcon = (typeof CHECKLIST_ICONS)[number];
export type ChecklistDisplayIcon = ChecklistIcon | 'list-outline';
export type ChecklistIconTone = 'water' | 'walk' | 'sleep' | 'food' | 'vaccination' | 'veterinary' | 'training' | 'neutral';

export const CHECKLIST_ICON_LABELS: Record<ChecklistIcon, string> = {
  paw: 'Tass', 'water-outline': 'Vatten', 'walk-outline': 'Promenad', 'bed-outline': 'Vila', 'sunny-outline': 'Sol',
  'leaf-outline': 'Natur', 'heart-outline': 'Hjärta', 'flower-outline': 'Blomma', 'brush-outline': 'Pälsvård',
  'bandage-outline': 'Första hjälpen', 'medkit-outline': 'Hälsa', 'restaurant-outline': 'Mat', 'moon-outline': 'Kväll',
  'football-outline': 'Lek', 'fitness-outline': 'Träning', 'sparkles-outline': 'Skötsel', 'home-outline': 'Hemma',
  'school-outline': 'Lärande', 'rose-outline': 'Doft', 'star-outline': 'Favorit',
};

export const CHECKLIST_ICON_TONES: Record<ChecklistDisplayIcon, ChecklistIconTone> = {
  paw: 'neutral', 'water-outline': 'water', 'walk-outline': 'walk', 'bed-outline': 'sleep', 'sunny-outline': 'neutral',
  'leaf-outline': 'neutral', 'heart-outline': 'neutral', 'flower-outline': 'neutral', 'brush-outline': 'neutral',
  'bandage-outline': 'vaccination', 'medkit-outline': 'veterinary', 'restaurant-outline': 'food', 'moon-outline': 'sleep',
  'football-outline': 'neutral', 'fitness-outline': 'training', 'sparkles-outline': 'neutral', 'home-outline': 'neutral',
  'school-outline': 'training', 'rose-outline': 'neutral', 'star-outline': 'neutral', 'list-outline': 'neutral',
};

const iconSet: ReadonlySet<string> = new Set(CHECKLIST_ICONS);

export function isChecklistIcon(value: unknown): value is ChecklistIcon {
  return typeof value === 'string' && iconSet.has(value);
}

export function checklistIconTone(icon: ChecklistDisplayIcon): ChecklistIconTone {
  return CHECKLIST_ICON_TONES[icon];
}
