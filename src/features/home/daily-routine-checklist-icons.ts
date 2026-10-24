import { CHECKLIST_ICONS, CHECKLIST_ICON_LABELS, checklistIconTone, isChecklistIcon, type ChecklistDisplayIcon, type ChecklistIcon, type ChecklistIconTone } from '../checklists/checklist-icons';

export { CHECKLIST_ICONS as DAILY_ROUTINE_CHECKLIST_ICONS, CHECKLIST_ICON_LABELS as DAILY_ROUTINE_CHECKLIST_ICON_LABELS };
export type DailyRoutineChecklistIcon = ChecklistIcon;
export type DailyRoutineChecklistDisplayIcon = ChecklistDisplayIcon;
export type DailyRoutineChecklistIconTone = ChecklistIconTone;

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

export const isDailyRoutineChecklistIcon = isChecklistIcon;

export function suggestDailyRoutineChecklistIcon(label: string): DailyRoutineChecklistIcon | null {
  const tokens = new Set(label.toLowerCase().match(/\p{L}+/gu) ?? []);
  const matches = CHECKLIST_ICONS.filter((icon) => LEGACY_ICON_TOKENS[icon].some((token) => tokens.has(token)));
  return matches.length === 1 ? matches[0] : null;
}

export function dailyRoutineChecklistDisplayIcon(item: { label: string; icon?: DailyRoutineChecklistIcon | null }): DailyRoutineChecklistDisplayIcon {
  if (isChecklistIcon(item.icon)) return item.icon;
  return suggestDailyRoutineChecklistIcon(item.label) ?? 'list-outline';
}

export const dailyRoutineChecklistIconTone = checklistIconTone;
