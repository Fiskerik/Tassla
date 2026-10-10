export const QUICK_LOG_LAYOUT_TYPES = ['pee', 'poop', 'food', 'sleep', 'walk', 'accident', 'water'] as const;
export type QuickLogLayoutType = typeof QUICK_LOG_LAYOUT_TYPES[number];

export interface QuickLogLayout {
  primary: QuickLogLayoutType[];
  more: QuickLogLayoutType[];
}

export const DEFAULT_QUICK_LOG_LAYOUT: QuickLogLayout = {
  primary: ['pee', 'poop', 'food', 'sleep'],
  more: ['walk', 'accident', 'water'],
};

export function normalizeQuickLogLayout(value: unknown): QuickLogLayout {
  if (!value || typeof value !== 'object') return cloneDefaultLayout();
  const row = value as Record<string, unknown>;
  const primary = normalizeGroup(row.primary);
  const more = normalizeGroup(row.more).filter((type) => !primary.includes(type));
  const missing = QUICK_LOG_LAYOUT_TYPES.filter((type) => !primary.includes(type) && !more.includes(type));
  return { primary, more: [...more, ...missing] };
}

export function moveQuickLogType(layout: QuickLogLayout, type: QuickLogLayoutType, destination: 'primary' | 'more'): QuickLogLayout {
  if (destination === 'more' && layout.primary.length <= 1 && layout.primary.includes(type)) return layout;
  const primary = layout.primary.filter((item) => item !== type);
  const more = layout.more.filter((item) => item !== type);
  if (destination === 'more') return { primary, more: [...more, type] };
  if (primary.length < 4) return { primary: [...primary, type], more };
  const displaced = primary[primary.length - 1];
  return { primary: [...primary.slice(0, -1), type], more: [...more, displaced] };
}

export function cloneDefaultLayout(): QuickLogLayout {
  return { primary: [...DEFAULT_QUICK_LOG_LAYOUT.primary], more: [...DEFAULT_QUICK_LOG_LAYOUT.more] };
}

function normalizeGroup(value: unknown): QuickLogLayoutType[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item, index): item is QuickLogLayoutType => (
    typeof item === 'string'
    && (QUICK_LOG_LAYOUT_TYPES as readonly string[]).includes(item)
    && value.indexOf(item) === index
  ));
}
