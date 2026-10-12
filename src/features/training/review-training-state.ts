export function isReviewTrainingProgram(programId: string) {
  return programId.startsWith('review-v1:training:');
}

export function completeReviewTrainingStep(state: Readonly<Record<string, readonly string[]>>, programId: string, stepId: string) {
  return { ...state, [programId]: [...new Set([...(state[programId] ?? []), stepId])] } as Record<string, string[]>;
}

export function undoReviewTrainingStep(state: Readonly<Record<string, readonly string[]>>, programId: string, stepId: string) {
  const completedStepIds = state[programId] ?? [];
  if (!completedStepIds.includes(stepId)) return state as Record<string, string[]>;
  return { ...state, [programId]: completedStepIds.filter((id) => id !== stepId) } as Record<string, string[]>;
}

export function resetReviewTrainingProgram(state: Readonly<Record<string, readonly string[]>>, programId: string) {
  return { ...state, [programId]: [] } as Record<string, string[]>;
}

export async function completeTrainingStepForMode<T>(programId: string, reviewMode: boolean, onReviewComplete: () => void, onPublishedComplete: () => Promise<T>): Promise<{ kind: 'review' } | { kind: 'published'; value: T }> {
  if (reviewMode && isReviewTrainingProgram(programId)) {
    onReviewComplete();
    return { kind: 'review' };
  }
  return { kind: 'published', value: await onPublishedComplete() };
}
