import type { HomeContent } from '../../data/app-data';
import type { ChecklistContext, ChecklistTemplate } from '../knowledge/checklist-model';

export function developmentPhase(templates: readonly ChecklistTemplate[], ageWeeks: number | null, context: ChecklistContext): ChecklistTemplate | null {
  if (context === 'before_homecoming' || context === 'first_days') {
    return templates.find((template) => template.phase === context) ?? null;
  }
  if (ageWeeks === null || !Number.isInteger(ageWeeks) || ageWeeks < 8) return null;
  const phase = ageWeeks < 13 ? '8_12_weeks' : ageWeeks < 26 ? '3_6_months' : ageWeeks < 52 ? '6_12_months' : 'over_1_year';
  return templates.find((template) => template.phase === phase) ?? null;
}

export function recommendedDevelopmentReading(items: readonly HomeContent[]): HomeContent[] {
  return items.filter((item) => (item.contentType === 'article' || item.contentType === 'guide') && item.recommended === true);
}
