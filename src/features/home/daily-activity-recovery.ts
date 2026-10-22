import type {
  DailyRoutine,
  DailyRoutineChecklistItem,
  DailyRoutineRepeatValues,
  DailyRoutineWriteResult,
} from './daily-activity-data';
import type { WriteOutcome } from '../../data/workspace-data';

export type DailyMutationOperation = () => Promise<WriteOutcome<unknown> | DailyRoutineWriteResult>;
type ActiveDailyMutation = {
  ownerScope: string;
  dogId: string;
  dogName: string;
  lifetime: string;
  key: string;
  run: DailyMutationOperation;
  actionLabel: string;
  phase: 'in-flight' | 'unknown';
};
type ResolvedDailyMutation = {
  ownerScope: string;
  phase: 'resolved';
  notice: { message: string; error: boolean };
};
export type PendingDailyMutation = ActiveDailyMutation | ResolvedDailyMutation;
export type DailyMutationOutcomeStatus = 'saved' | 'failed' | 'unknown' | 'conflict';
export type DailyMutationRecovery = {
  pendingRetry: PendingDailyMutation | null;
  message: string;
  error: boolean;
  reload: boolean;
};

export type RoutineDraft = {
  mode: 'create' | 'edit';
  submissionId: string;
  routineId: string | null;
  baseRevision: number | null;
  sourceRoutine: DailyRoutine | null;
  initialLabel: string;
  initialChecklist: DailyRoutineChecklistItem[];
  initialRepeat: DailyRoutineRepeatValues;
  anchorDate: string;
  newAnchorDate: string;
  label: string;
  checklist: DailyRoutineChecklistItem[];
  repeat: DailyRoutineRepeatValues;
};

export type RoutineDraftConflict = {
  submissionId: string;
  routineId: string;
  scopeKey: string;
  latest: DailyRoutine;
};

export type RoutineDraftRecovery = {
  ownerScope: string;
  dogId: string;
  lifetime: string;
  draft: RoutineDraft;
  conflict: RoutineDraftConflict | null;
};

export const routineConflictMessage = 'Rutinen har ändrats sedan du öppnade den. Ladda den senaste versionen för att fortsätta. Dina osparade ändringar ersätts.';

export function recoverDailyMutation(
  status: DailyMutationOutcomeStatus,
  ownerScope: string,
  lifetime: string,
  key: string,
  operation: DailyMutationOperation,
  origin: { dogId: string; dogName: string; actionLabel: string } = { dogId: '', dogName: '', actionLabel: 'ändringen' },
): DailyMutationRecovery {
  switch (status) {
    case 'saved':
      return { pendingRetry: null, message: '', error: false, reload: true };
    case 'failed':
      return { pendingRetry: null, message: 'Ändringen sparades inte. Försök igen.', error: true, reload: false };
    case 'unknown':
      return {
        pendingRetry: { ownerScope, ...origin, lifetime, key, run: operation, phase: 'unknown' },
        message: 'Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.',
        error: true,
        reload: false,
      };
    case 'conflict':
      return { pendingRetry: null, message: '', error: false, reload: true };
  }
}

export function dailyMutationNoticeForStaleOutcome(
  status: DailyMutationOutcomeStatus,
  dogName: string,
  actionLabel: string,
): { message: string; error: boolean } | null {
  switch (status) {
    case 'saved':
      return { message: `${actionLabel} för ${dogName} sparades i den tidigare vyn.`, error: false };
    case 'failed':
      return { message: `${actionLabel} för ${dogName} sparades inte. Öppna Checklistor igen och gör om ändringen.`, error: true };
    case 'conflict':
      return { message: `${actionLabel} för ${dogName} krockade med en nyare version. Öppna Checklistor igen för att läsa in den senaste versionen.`, error: true };
    case 'unknown':
      return null;
  }
}

export function createDailyMutationStore(initial: ReadonlyMap<string, PendingDailyMutation> = new Map()) {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  const ownerGenerations = new Map<string, number>();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    ownerGeneration(ownerScope: string) {
      return ownerGenerations.get(ownerScope) ?? 0;
    },
    update(ownerScope: string, pending: PendingDailyMutation | null, expectedOwnerGeneration?: number) {
      if (expectedOwnerGeneration !== undefined && expectedOwnerGeneration !== (ownerGenerations.get(ownerScope) ?? 0)) return;
      if (pending && pending.ownerScope !== ownerScope) throw new Error('Daily mutation owner scope mismatch');
      if (snapshot.get(ownerScope) === pending || (!pending && !snapshot.has(ownerScope))) return;
      const next = new Map(snapshot);
      if (pending) next.set(ownerScope, pending);
      else next.delete(ownerScope);
      snapshot = next;
      listeners.forEach((listener) => listener());
    },
    clearOwner(ownerScope: string) {
      ownerGenerations.set(ownerScope, (ownerGenerations.get(ownerScope) ?? 0) + 1);
      if (!snapshot.has(ownerScope)) return;
      const next = new Map(snapshot);
      next.delete(ownerScope);
      snapshot = next;
      listeners.forEach((listener) => listener());
    },
  };
}

// This store intentionally outlives dog-keyed ProductWorkspace mounts. A pending write
// contains only its exact retry closure and remains isolated by authenticated owner id.
export const dailyMutationStore = createDailyMutationStore();

function copyRoutine(routine: DailyRoutine | null): DailyRoutine | null {
  if (!routine) return null;
  return { ...routine, checklist: routine.checklist.map((item) => ({ ...item })),
    repeat_weekdays: routine.repeat_weekdays ? [...routine.repeat_weekdays] : null };
}

function copyRoutineDraft(draft: RoutineDraft): RoutineDraft {
  return { ...draft, sourceRoutine: copyRoutine(draft.sourceRoutine),
    initialChecklist: draft.initialChecklist.map((item) => ({ ...item })),
    initialRepeat: { ...draft.initialRepeat, repeat_weekdays: draft.initialRepeat.repeat_weekdays ? [...draft.initialRepeat.repeat_weekdays] : null },
    checklist: draft.checklist.map((item) => ({ ...item })),
    repeat: { ...draft.repeat, repeat_weekdays: draft.repeat.repeat_weekdays ? [...draft.repeat.repeat_weekdays] : null } };
}

function copyRoutineDraftRecovery(record: RoutineDraftRecovery): RoutineDraftRecovery {
  return { ...record, draft: copyRoutineDraft(record.draft), conflict: record.conflict
    ? { ...record.conflict, latest: copyRoutine(record.conflict.latest)! } : null };
}

export function routineDraftRecoveryScopeKey(ownerScope: string, dogId: string, lifetime: string) {
  return JSON.stringify([ownerScope, dogId, lifetime]);
}

export function createRoutineDraftStore(initial: ReadonlyMap<string, RoutineDraftRecovery> = new Map()) {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  const ownerGenerations = new Map<string, number>();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get(ownerScope: string, dogId: string, lifetime: string) {
      const record = snapshot.get(routineDraftRecoveryScopeKey(ownerScope, dogId, lifetime));
      return record?.ownerScope === ownerScope && record.dogId === dogId && record.lifetime === lifetime
        ? copyRoutineDraftRecovery(record) : null;
    },
    ownerGeneration(ownerScope: string) {
      return ownerGenerations.get(ownerScope) ?? 0;
    },
    update(ownerScope: string, dogId: string, lifetime: string, draft: RoutineDraft | null, conflict: RoutineDraftConflict | null = null, expectedOwnerGeneration?: number) {
      if (expectedOwnerGeneration !== undefined && expectedOwnerGeneration !== (ownerGenerations.get(ownerScope) ?? 0)) return;
      const key = routineDraftRecoveryScopeKey(ownerScope, dogId, lifetime);
      const next = draft ? copyRoutineDraftRecovery({ ownerScope, dogId, lifetime, draft, conflict }) : null;
      if (snapshot.get(key) === next || (!next && !snapshot.has(key))) return;
      const updated = new Map(snapshot);
      if (next) updated.set(key, next);
      else updated.delete(key);
      snapshot = updated;
      listeners.forEach((listener) => listener());
    },
    clearOwner(ownerScope: string) {
      ownerGenerations.set(ownerScope, (ownerGenerations.get(ownerScope) ?? 0) + 1);
      const updated = new Map(snapshot);
      for (const [key, record] of updated) if (record.ownerScope === ownerScope) updated.delete(key);
      if (updated.size === snapshot.size) return;
      snapshot = updated;
      listeners.forEach((listener) => listener());
    },
  };
}

// In-memory only: route and dog switches preserve a draft, but process termination does not.
export const routineDraftStore = createRoutineDraftStore();

export function resolvedDailyMutation(
  mutation: ActiveDailyMutation,
  status: Exclude<DailyMutationOutcomeStatus, 'unknown'>,
): ResolvedDailyMutation | null {
  const notice = dailyMutationNoticeForStaleOutcome(status, mutation.dogName || 'den tidigare valda hunden', mutation.actionLabel);
  return notice ? { ownerScope: mutation.ownerScope, phase: 'resolved', notice } : null;
}

export function clearDailyMutationForLifetimeChange(): Pick<DailyMutationRecovery, 'message' | 'error'> {
  return { message: '', error: false };
}

export function dailyMutationForOwner(
  pending: PendingDailyMutation | null,
  ownerScope: string,
): PendingDailyMutation | null {
  return pending?.ownerScope === ownerScope ? pending : null;
}

export function dailyMutationRetryForLifetime(
  pending: PendingDailyMutation | null,
  lifetime: string,
): PendingDailyMutation | null {
  return pending && pending.phase !== 'resolved' && pending.lifetime === lifetime ? pending : null;
}

export function canStartDailyMutation(
  pending: PendingDailyMutation | null,
  ownerScope: string,
  retryPending?: PendingDailyMutation,
): boolean {
  if (retryPending) return pending === retryPending && retryPending.ownerScope === ownerScope && retryPending.phase === 'unknown';
  const ownerPending = dailyMutationForOwner(pending, ownerScope);
  return !ownerPending || ownerPending.phase === 'resolved';
}

export function dailyMutationBlocksAccountDeletion(
  inFlight: boolean,
  pending: PendingDailyMutation | null,
  ownerScope: string,
): boolean {
  const ownerPending = dailyMutationForOwner(pending, ownerScope);
  return inFlight || Boolean(ownerPending && ownerPending.phase !== 'resolved');
}

export function routineDraftAfterWrite(
  currentDraft: RoutineDraft | null,
  submissionId: string,
  status: DailyMutationOutcomeStatus | undefined,
): RoutineDraft | null {
  return status === 'saved' && currentDraft?.submissionId === submissionId ? null : currentDraft;
}

export function routineConflictAfterWrite(
  submittedDraft: RoutineDraft,
  result: { status: 'conflict'; value: DailyRoutine } | { status: 'saved' | 'failed' | 'unknown' } | undefined,
  scopeKey: string,
): RoutineDraftConflict | null {
  if (result?.status !== 'conflict' || submittedDraft.mode !== 'edit' || result.value.id !== submittedDraft.routineId) return null;
  return {
    submissionId: submittedDraft.submissionId,
    routineId: submittedDraft.routineId,
    scopeKey,
    latest: result.value,
  };
}

export function routineConflictForDraft(
  draft: RoutineDraft | null,
  conflict: RoutineDraftConflict | null,
  scopeKey: string,
): RoutineDraftConflict | null {
  if (!draft || draft.mode !== 'edit' || !conflict
    || conflict.submissionId !== draft.submissionId
    || conflict.routineId !== draft.routineId
    || conflict.scopeKey !== scopeKey) return null;
  return conflict;
}

export function routineEditDraftFromConflict(
  draft: RoutineDraft | null,
  conflict: RoutineDraftConflict | null,
  scopeKey: string,
  submissionId: string,
  today: string,
): RoutineDraft | null {
  const applicableConflict = routineConflictForDraft(draft, conflict, scopeKey);
  if (!applicableConflict) return null;
  const latest = applicableConflict.latest;
  const checklist = latest.checklist.map((item) => ({ ...item }));
  const repeat = { repeat_unit: latest.repeat_unit, repeat_interval: latest.repeat_interval, repeat_weekdays: latest.repeat_weekdays };
  return {
    mode: 'edit',
    submissionId,
    routineId: latest.id,
    baseRevision: latest.checklist_revision,
    sourceRoutine: latest,
    initialLabel: latest.label,
    initialChecklist: checklist,
    initialRepeat: repeat,
    anchorDate: latest.repeat_anchor_date ?? today,
    newAnchorDate: today,
    label: latest.label,
    checklist,
    repeat,
  };
}
