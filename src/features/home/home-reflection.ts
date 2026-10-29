import { LOG_EVENT_LABELS, type LogEvent } from '../puppy-log/log-model.ts';
import type { PublishedTrainingProgram } from '../../data/workspace-data';
import type { TrainingProgressionWorkspace } from '../training/training-progression';

export type TrainingReflection = { label: string; date: string; occurredAt: string; programVersionId: string; kind: 'session' | 'milestone' };

/** Pick only a confirmed, non-future event belonging to the current dog. */
export function latestHomeReflection(events: readonly LogEvent[], dogId: string, now = new Date()): { label: string; date: string; occurredAt: string } | null {
  const nowTime = now.getTime();
  if (!Number.isFinite(nowTime)) return null;
  const latest = events
    .filter((event) => event.dogId === dogId && Number.isFinite(Date.parse(event.occurredAt)) && Date.parse(event.occurredAt) <= nowTime)
    .reduce<LogEvent | null>((current, event) => !current || Date.parse(event.occurredAt) > Date.parse(current.occurredAt) ? event : current, null);
  if (!latest) return null;
  const eventDate = new Date(latest.occurredAt);
  const date = new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric', month: 'long', ...(eventDate.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(eventDate);
  return { label: LOG_EVENT_LABELS[latest.type], date, occurredAt: latest.occurredAt };
}

/** Only verified, available versions and the current dog's dated training history are eligible. */
export function latestTrainingReflection(workspace: TrainingProgressionWorkspace, programs: readonly PublishedTrainingProgram[], dogId: string,
  blockedVersions: ReadonlySet<string> = new Set(), now = new Date()): TrainingReflection | null {
  const latestAllowed = now.getTime();
  if (!Number.isFinite(latestAllowed)) return null;
  const candidates = [
    ...workspace.sessions.map((row) => ({ ...row, occurredAt: row.performed_at, kind: 'session' as const })),
    ...workspace.milestones.map((row) => ({ ...row, occurredAt: row.confirmed_at, kind: 'milestone' as const })),
  ].filter((row) => row.dog_id === dogId && !blockedVersions.has(row.program_version_id)
    && Number.isFinite(Date.parse(row.occurredAt)) && Date.parse(row.occurredAt) <= latestAllowed
    && workspace.journeys.some((journey) => journey.id === row.journey_id && journey.dog_id === dogId && journey.program_version_id === row.program_version_id))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt) || Number(b.kind === 'milestone') - Number(a.kind === 'milestone'));
  for (const candidate of candidates) {
    const program = programs.find((item) => item.id === candidate.program_version_id);
    const step = program?.steps.find((item) => item.id === candidate.step_id);
    if (!program || !step) continue;
    const eventDate = new Date(candidate.occurredAt);
    const date = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long',
      ...(eventDate.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }) }).format(eventDate);
    return { label: step.title, date, occurredAt: candidate.occurredAt, programVersionId: program.id, kind: candidate.kind };
  }
  return null;
}
