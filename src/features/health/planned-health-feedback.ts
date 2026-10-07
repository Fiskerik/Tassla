export type PlannedHealthRecovery = 'conflict' | 'pending' | 'error' | null;

export type PlannedHealthFeedbackState = Readonly<{
  activeMessage: string | null;
  queuedMessage: string | null;
}>;

export const EMPTY_PLANNED_HEALTH_FEEDBACK: PlannedHealthFeedbackState = {
  activeMessage: null,
  queuedMessage: null,
};

export type PlannedHealthFeedbackEvent =
  | { type: 'status'; message: string; infoVisible: boolean }
  | { type: 'dismiss'; message?: string }
  | { type: 'info-opened' }
  | { type: 'info-closed' };

function normalizedMessage(message: string): string | null {
  return message.trim() ? message : null;
}

export function initialPlannedHealthStatus(message: string): string | null {
  return normalizedMessage(message);
}

export function reducePlannedHealthFeedback(
  state: PlannedHealthFeedbackState,
  event: PlannedHealthFeedbackEvent,
): PlannedHealthFeedbackState {
  if (event.type === 'status') {
    const message = normalizedMessage(event.message);
    return event.infoVisible
      ? { activeMessage: null, queuedMessage: message }
      : { activeMessage: message, queuedMessage: null };
  }
  if (event.type === 'dismiss') {
    if (event.message !== undefined && event.message !== state.activeMessage) return state;
    return { activeMessage: null, queuedMessage: state.queuedMessage };
  }
  if (event.type === 'info-opened') {
    return state.activeMessage
      ? { activeMessage: null, queuedMessage: state.activeMessage }
      : state;
  }
  return state.queuedMessage
    ? { activeMessage: state.queuedMessage, queuedMessage: null }
    : state;
}

export function feedbackTimeoutMillis(recommended: number | null | undefined, fallback = 5000): number {
  return typeof recommended === 'number' && Number.isFinite(recommended) && recommended > 0 ? recommended : fallback;
}

export function selectPlannedHealthRecovery(input: {
  conflict: boolean;
  pending: boolean;
  statusError: boolean;
  loadError: boolean;
}): PlannedHealthRecovery {
  if (input.conflict) return 'conflict';
  if (input.pending) return 'pending';
  if (input.statusError || input.loadError) return 'error';
  return null;
}
