import type { ChecklistIcon } from '../checklists/checklist-icons';

export const CHECKLIST_VERSION = 'review-v1';
export const CHECKLIST_CONTEXTS = ['before_homecoming', 'first_days', 'by_age'] as const;
export type ChecklistContext = typeof CHECKLIST_CONTEXTS[number];

export const CHECKLIST_PHASE_ROOTS = [
  { id: 'review-v1:before-homecoming', slug: 'phase-before-homecoming', context: 'before_homecoming', phase: 'before_homecoming', minAgeWeeks: 0, maxAgeWeeks: 7, itemKeys: ['safe-space', 'supplies', 'vet-contact'] },
  { id: 'review-v1:first-days', slug: 'phase-first-days', context: 'first_days', phase: 'first_days', minAgeWeeks: 0, maxAgeWeeks: null, itemKeys: ['quiet-start', 'routine', 'rest'] },
  { id: 'review-v1:8-12-weeks', slug: 'phase-8-12-weeks', context: 'by_age', phase: '8_12_weeks', minAgeWeeks: 8, maxAgeWeeks: 12, itemKeys: ['name', 'handling', 'alone'] },
  { id: 'review-v1:3-6-months', slug: 'phase-3-6-months', context: 'by_age', phase: '3_6_months', minAgeWeeks: 13, maxAgeWeeks: 25, itemKeys: ['recall', 'settle', 'walks'] },
  { id: 'review-v1:6-12-months', slug: 'phase-6-12-months', context: 'by_age', phase: '6_12_months', minAgeWeeks: 26, maxAgeWeeks: 51, itemKeys: ['review', 'focus', 'breaks'] },
  { id: 'review-v1:over-1-year', slug: 'phase-over-1-year', context: 'by_age', phase: 'over_1_year', minAgeWeeks: 52, maxAgeWeeks: null, itemKeys: ['enjoy', 'adapt', 'play'] },
] as const;

export interface ChecklistItem { key: string; title: string; }
export interface ChecklistTemplate {
  id: string; phase: 'before_homecoming' | 'first_days' | '8_12_weeks' | '3_6_months' | '6_12_months' | 'over_1_year';
  title: string; intro: string; minAgeWeeks: number; maxAgeWeeks: number | null; items: readonly ChecklistItem[];
  versionId?: string; sources?: readonly string[];
}
export interface ChecklistCustomItem { id: string; dogId: string; templateId: string; title: string; completed: boolean; icon: ChecklistIcon | null; }
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
  if (ageWeeks < 8) return 'before_homecoming';
  if (ageWeeks < 13) return '8_12_weeks';
  if (ageWeeks < 26) return '3_6_months';
  if (ageWeeks < 52) return '6_12_months';
  return 'over_1_year';
}

export function isChecklistContext(value: unknown): value is ChecklistContext {
  return CHECKLIST_CONTEXTS.includes(value as ChecklistContext);
}
