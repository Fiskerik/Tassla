import { legacyChecklistPhaseForAgeWeeks } from '../onboarding/life-stages.ts';

export const CHECKLIST_VERSION = 'review-v1';
export const CHECKLIST_CONTEXTS = ['before_homecoming', 'first_days', 'by_age'] as const;
export type ChecklistContext = typeof CHECKLIST_CONTEXTS[number];

export interface ChecklistItem { key: string; title: string; }
export interface ChecklistTemplate {
  id: string; phase: 'before_homecoming' | 'first_days' | '8_12_weeks' | '3_6_months' | '6_12_months' | 'over_1_year';
  title: string; intro: string; minAgeWeeks: number; maxAgeWeeks: number | null; items: readonly ChecklistItem[];
}
export interface ChecklistCustomItem { id: string; dogId: string; templateId: string; title: string; completed: boolean; }
export interface ChecklistProgress { dogId: string; templateId: string; itemKey: string; }
export interface ChecklistPreference { dogId: string; context: ChecklistContext; }
export type ChecklistWriteOutcome<T> = { status: 'saved'; value: T } | { status: 'failed' | 'unknown' | 'conflict' };

export function normalizeCustomChecklistTitle(value: string): string | null {
  const title = value.trim();
  const length = Array.from(title).length;
  return length > 0 && length <= 160 ? title : null;
}

export function checklistPercent(completed: number, total: number): number {
  return total > 0 ? Math.round(Math.min(Math.max(completed, 0), total) / total * 100) : 0;
}

export function chooseChecklistPhase(ageWeeks: number | null, context: ChecklistContext): ChecklistTemplate['phase'] | null {
  if (context === 'before_homecoming') return 'before_homecoming';
  if (context === 'first_days') return 'first_days';
  if (ageWeeks === null) return null;
  return legacyChecklistPhaseForAgeWeeks(ageWeeks);
}

export function isChecklistContext(value: unknown): value is ChecklistContext {
  return CHECKLIST_CONTEXTS.includes(value as ChecklistContext);
}
