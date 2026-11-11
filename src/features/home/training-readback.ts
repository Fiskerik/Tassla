import type { TrainingProgressionWorkspace } from '../training/training-progression.ts';

type ProgressionSnapshot = { progression: TrainingProgressionWorkspace; progressionState: 'ready' | 'error' };

/** Merge only a validated dog-scoped readback into a matching content snapshot. */
export function mergeTrainingReadback<T extends ProgressionSnapshot>(
  cache: { scope: string; value: T; updatedAt: number } | null,
  scope: string,
  dogId: string,
  progression: TrainingProgressionWorkspace,
): { scope: string; value: T; updatedAt: number } | null {
  if (!cache || cache.scope !== scope || !dogId
    || [...progression.journeys, ...progression.sessions, ...progression.milestones].some((row) => row.dog_id !== dogId)) return null;
  return { ...cache, value: { ...cache.value, progression, progressionState: 'ready' } };
}

/** Only the acknowledged operation may clear or downgrade its own pending entry. */
export function updateTrainingPending<T extends { operationId: string; status: 'pending' | 'unknown' }>(
  pending: Readonly<Record<string, T>>, key: string, operationId: string, result: 'clear' | 'unknown',
): Record<string, T> {
  const entry = pending[key];
  if (!entry || entry.operationId !== operationId) return pending as Record<string, T>;
  const next = { ...pending };
  if (result === 'clear') delete next[key];
  else next[key] = { ...entry, status: 'unknown' };
  return next;
}
