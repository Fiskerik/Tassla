import type { ChecklistContext, ChecklistCustomItem, ChecklistProgress } from './checklist-model';

export type PendingChecklistOperation =
  | { kind: 'preset'; templateId: string; itemKey: string; completed: boolean }
  | { kind: 'preference'; context: ChecklistContext }
  | { kind: 'add'; templateId: string; id: string; title: string }
  | { kind: 'update'; previous: ChecklistCustomItem; changes: Pick<ChecklistCustomItem, 'title' | 'completed'> }
  | { kind: 'delete'; previous: ChecklistCustomItem };

export type PendingChecklistMemory = { operation: PendingChecklistOperation; draft: { id: string | null; requestId: string; title: string; completed: boolean } | null; uncertain: boolean };
export type LoadedChecklistIntentState = { preference?: ChecklistContext | null; progress: readonly ChecklistProgress[]; customItems: readonly ChecklistCustomItem[] };
export type PendingChecklistDecision = 'saved' | 'retry' | 'conflict';
export type ScopedChecklistMemory = { scope: string; state: PendingChecklistMemory };

export function checklistMemoryScope(userId: string | null, accountGeneration: number, dogId: string) {
  return `${userId ?? 'signed-out'}:${accountGeneration}:${dogId}`;
}

export function keepChecklistMemoryForScope(memory: ScopedChecklistMemory | null, scope: string): ScopedChecklistMemory | null {
  return memory?.scope === scope ? memory : null;
}

export function updateChecklistMemory(memory: ScopedChecklistMemory | null, scope: string, state: PendingChecklistMemory | null): ScopedChecklistMemory | null {
  return state ? { scope, state } : null;
}

export function freezePendingChecklistMemory(operation: PendingChecklistOperation, draft: PendingChecklistMemory['draft']): PendingChecklistMemory {
  const snapshot = operation.kind === 'update' || operation.kind === 'delete'
    ? { ...operation, previous: { ...operation.previous }, ...(operation.kind === 'update' ? { changes: { ...operation.changes } } : {}) }
    : { ...operation };
  return { operation: snapshot, draft: draft ? { ...draft } : null, uncertain: true };
}

export function classifyPendingChecklistOperation(operation: PendingChecklistOperation, loaded: LoadedChecklistIntentState): PendingChecklistDecision {
  if (operation.kind === 'preference') return loaded.preference === operation.context ? 'saved' : 'retry';
  if (operation.kind === 'preset') return loaded.progress.some((row) => row.templateId === operation.templateId && row.itemKey === operation.itemKey) === operation.completed ? 'saved' : 'retry';
  if (operation.kind === 'add') {
    const item = loaded.customItems.find((row) => row.id === operation.id);
    if (!item) return 'retry';
    return item.templateId === operation.templateId && item.title === operation.title && !item.completed ? 'saved' : 'conflict';
  }
  const item = loaded.customItems.find((row) => row.id === operation.previous.id);
  if (operation.kind === 'delete') {
    if (!item) return 'saved';
    return sameCustom(item, operation.previous) ? 'retry' : 'conflict';
  }
  if (item && item.templateId === operation.previous.templateId && item.title === operation.changes.title && item.completed === operation.changes.completed) return 'saved';
  if (item && sameCustom(item, operation.previous)) return 'retry';
  return 'conflict';
}

function sameCustom(left: ChecklistCustomItem, right: ChecklistCustomItem) {
  return left.id === right.id && left.dogId === right.dogId && left.templateId === right.templateId && left.title === right.title && left.completed === right.completed;
}
