import type { LogEvent } from './log-model.ts';

export type LogEventFocus = { requestId: number; eventId: string; dogId: string; available: boolean };
export type LogFocusDecision = { kind: 'ignored' } | { kind: 'blocked' } | { kind: 'missing' } | { kind: 'open'; event: LogEvent };

/** Resolve a one-shot navigation request without changing events or editor state. */
export function resolveLogEventFocus(request: LogEventFocus | null | undefined, handledRequestId: number | null,
  events: readonly LogEvent[], blocked: boolean): LogFocusDecision {
  if (!request || (handledRequestId !== null && request.requestId <= handledRequestId)) return { kind: 'ignored' };
  if (blocked) return { kind: 'blocked' };
  const event = request.available ? events.find((row) => row.id === request.eventId && row.dogId === request.dogId) : undefined;
  return event ? { kind: 'open', event } : { kind: 'missing' };
}
