import type { HealthHistoryType } from '../../data/workspace-data';

export type HealthHistoryDraftValue = {
  type: HealthHistoryType;
  date: string;
  time: string;
  note: string;
};

export function isDirtyHealthHistoryDraft(
  baseline: HealthHistoryDraftValue,
  current: HealthHistoryDraftValue,
): boolean {
  return baseline.type !== current.type
    || baseline.date !== current.date
    || baseline.time !== current.time
    || baseline.note !== current.note;
}
