export type TrainingTimelineState = 'confirmed' | 'active' | 'previous' | 'upcoming';

export interface TrainingTimelineStep {
  id: string;
  position: number;
  title: string;
  instruction: string;
}

export interface TrainingTimelineEntry {
  step: TrainingTimelineStep;
  index: number;
  state: TrainingTimelineState;
  statusLabel: string;
  milestoneLabel: string | null;
  legacyActivityLabel: string | null;
}

/** A confirmed milestone is the only source for a skill-completion date. */
export function formatTrainingTimelineDate(
  timestamp: string | null | undefined,
  now: Date = new Date(),
  timeZone?: string,
): string | null {
  if (!timestamp) return null;
  const calendarDate = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(timestamp);
  if (calendarDate) {
    const year = Number(calendarDate[1]);
    const month = Number(calendarDate[2]);
    const day = Number(calendarDate[3]);
    const daysInMonth = month >= 1 && month <= 12 ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 0;
    if (day < 1 || day > daysInMonth) return null;
  }
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(now.getTime())) return null;

  try {
    const dateParts = new Intl.DateTimeFormat('sv-SE', {
      day: 'numeric', month: 'long', year: 'numeric', ...(timeZone ? { timeZone } : {}),
    }).formatToParts(date);
    const nowParts = new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric', ...(timeZone ? { timeZone } : {}),
    }).formatToParts(now);
    const part = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
    const day = part(dateParts, 'day');
    const month = part(dateParts, 'month');
    const year = part(dateParts, 'year');
    if (!day || !month || !year) return null;
    return year === part(nowParts, 'year') ? `${day} ${month}` : `${day} ${month} ${year}`;
  } catch {
    return null;
  }
}

/** Legacy activity is recorded separately and never changes timeline completion state. */
export function buildTrainingTimeline(
  steps: readonly TrainingTimelineStep[],
  activeStepId: string | null,
  confirmedAtByStepId: Readonly<Record<string, string>>,
  legacyCompletedAtByStepId: Readonly<Record<string, string>>,
  legacyCompletedStepIds: ReadonlySet<string>,
  now: Date = new Date(),
  timeZone?: string,
  activeLabel = 'Aktivt steg',
): TrainingTimelineEntry[] {
  const activeIndex = activeStepId ? steps.findIndex((step) => step.id === activeStepId) : -1;
  return steps.map((step, index) => {
    const milestoneDate = formatTrainingTimelineDate(confirmedAtByStepId[step.id], now, timeZone);
    const legacyDate = formatTrainingTimelineDate(legacyCompletedAtByStepId[step.id], now, timeZone);
    const hasLegacyActivity = legacyCompletedStepIds.has(step.id);
    const confirmed = Object.hasOwn(confirmedAtByStepId, step.id);
    const state: TrainingTimelineState = step.id === activeStepId
      ? 'active'
      : confirmed ? 'confirmed'
        : activeIndex >= 0 && index < activeIndex ? 'previous' : 'upcoming';
    const milestoneLabel = confirmed ? `Delmål bekräftat${milestoneDate ? ` · ${milestoneDate}` : ''}` : null;
    const statusLabel = state === 'confirmed'
      ? milestoneLabel!
      : state === 'active' ? activeLabel
        : state === 'previous' ? 'Tidigare steg' : 'Kommande';
    const legacyActivityLabel = hasLegacyActivity && state !== 'confirmed'
      ? `Aktivitet markerad${legacyDate ? ` · ${legacyDate}` : ''}` : null;
    return { step, index, state, statusLabel, milestoneLabel, legacyActivityLabel };
  });
}
