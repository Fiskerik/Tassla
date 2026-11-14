/** Experimental pure protocol. Persistence, delivery and UI are deliberately absent. */
import type { DogEventOperation, DogEventRecord } from '../../data/workspace-data';
import { LOG_ENTRY_TYPES, isCanonicalAccidentKinds } from './log-model';

export type QueueStatus = 'queued' | 'attempting' | 'unknown' | 'rejected';
export type QueueScope = { ownerId: string; dogId: string; generation: string };
export type QueueIntent = { operation: DogEventOperation; status: QueueStatus; lease: string | null };
export type QueueSnapshot = { version: 1; scope: QueueScope; revision: number; items: QueueIntent[] };
export type QueueProposal = { base: QueueSnapshot; next: QueueSnapshot; effect: 'none' | 'send' | 'confirmed'; lease: string | null; proof: DogEventRecord | null };
export type QueueResult<T> = { ok: true; value: T } | { ok: false; reason: string };

const fail = (reason: string): QueueResult<never> => ({ ok: false, reason });
const ok = <T>(value: T): QueueResult<T> => ({ ok: true, value });
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const keysAre = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).sort().join('|') === keys.slice().sort().join('|');
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const token = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 128;
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical)
  : isObject(value) ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
const same = (a: unknown, b: unknown) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function validScope(scope: unknown): scope is QueueScope {
  return isObject(scope) && keysAre(scope, ['ownerId', 'dogId', 'generation']) && uuid(scope.ownerId) && uuid(scope.dogId) && token(scope.generation);
}
function validOperation(value: unknown, dogId: string): value is DogEventOperation {
  if (!isObject(value) || !keysAre(value, ['id', 'dog_id', 'event_type', 'occurred_at', 'duration_minutes', 'description', 'accident_kinds'])) return false;
  return uuid(value.id) && value.dog_id === dogId && typeof value.event_type === 'string'
    && LOG_ENTRY_TYPES.includes(value.event_type as typeof LOG_ENTRY_TYPES[number])
    && typeof value.occurred_at === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.occurred_at)
    && Number.isFinite(Date.parse(value.occurred_at)) && new Date(value.occurred_at).toISOString() === value.occurred_at
    && value.duration_minutes === null && value.description === null
    && (value.event_type === 'accident' ? isCanonicalAccidentKinds(value.accident_kinds) : value.accident_kinds === null);
}
export function validateSnapshot(value: unknown, scope: QueueScope, capacity: number): QueueResult<QueueSnapshot> {
  if (!validScope(scope) || !Number.isSafeInteger(capacity) || capacity < 1) return fail('invalid-context');
  if (!isObject(value) || !keysAre(value, ['version', 'scope', 'revision', 'items']) || value.version !== 1
    || !validScope(value.scope) || !Number.isSafeInteger(value.revision) || (value.revision as number) < 0 || !Array.isArray(value.items)) return fail('invalid-snapshot');
  if (!same(value.scope, scope)) return fail('scope-mismatch');
  if (value.items.length > capacity) return fail('over-capacity');
  const ids = new Set<string>();
  for (const [index, item] of value.items.entries()) {
    if (!isObject(item) || !keysAre(item, ['operation', 'status', 'lease']) || !validOperation(item.operation, scope.dogId)
      || !['queued', 'attempting', 'unknown', 'rejected'].includes(item.status as string)
      || (item.status === 'attempting' ? !token(item.lease) : item.lease !== null)
      || (index > 0 && item.status !== 'queued') || ids.has(item.operation.id)) return fail('invalid-intent');
    ids.add(item.operation.id);
  }
  return ok(clone(value as QueueSnapshot));
}
function proposal(base: QueueSnapshot, items: QueueIntent[], effect: QueueProposal['effect'] = 'none', lease: string | null = null, proof: DogEventRecord | null = null): QueueResult<QueueProposal> {
  if (base.revision >= Number.MAX_SAFE_INTEGER) return fail('revision-exhausted');
  return ok({ base: clone(base), next: { ...clone(base), revision: base.revision + 1, items: clone(items) }, effect, lease, proof: clone(proof) });
}
export function enqueue(snapshot: QueueSnapshot, scope: QueueScope, capacity: number, operation: DogEventOperation): QueueResult<QueueProposal> {
  const checked = validateSnapshot(snapshot, scope, capacity);
  if (!checked.ok) return checked;
  const base = checked.value;
  if (!validOperation(operation, scope.dogId)) return fail('invalid-operation');
  if (base.items.some((item) => item.operation.id === operation.id)) return fail('id-conflict');
  if (base.items.length >= capacity) return fail('full');
  if (base.items[0]?.status === 'attempting') return fail('lease-active');
  return proposal(base, [...base.items, { operation: clone(operation), status: 'queued', lease: null }]);
}
export function cancelHead(snapshot: QueueSnapshot, scope: QueueScope, capacity: number): QueueResult<QueueProposal> {
  const checked = validateSnapshot(snapshot, scope, capacity);
  if (!checked.ok) return checked;
  if (checked.value.items[0]?.status !== 'queued') return fail('not-cancellable');
  return proposal(checked.value, checked.value.items.slice(1));
}
export function beginAttempt(snapshot: QueueSnapshot, scope: QueueScope, capacity: number, lease: string): QueueResult<QueueProposal> {
  const checked = validateSnapshot(snapshot, scope, capacity);
  if (!checked.ok) return checked;
  if (!token(lease) || checked.value.items[0]?.status !== 'queued') return fail('not-sendable');
  const [head, ...tail] = checked.value.items;
  return proposal(checked.value, [{ ...head, status: 'attempting', lease }, ...tail], 'send', lease);
}
export function recoverAfterRestart(snapshot: QueueSnapshot, newScope: QueueScope, capacity: number): QueueResult<QueueProposal> {
  if (!validScope(newScope) || !validScope(snapshot?.scope) || snapshot.scope.ownerId !== newScope.ownerId
    || snapshot.scope.dogId !== newScope.dogId || snapshot.scope.generation === newScope.generation) return fail('invalid-restart-scope');
  const checked = validateSnapshot(snapshot, snapshot.scope, capacity);
  if (!checked.ok) return checked;
  const [head, ...tail] = checked.value.items;
  const items = head?.status === 'attempting' ? [{ ...head, status: 'unknown' as const, lease: null }, ...tail] : checked.value.items;
  const result = proposal(checked.value, items);
  if (!result.ok) return result;
  result.value.next.scope = clone(newScope);
  return result;
}

function sameTimestamp(serverTime: unknown, requested: string): boolean {
  if (typeof serverTime !== 'string') return false;
  const match = serverTime.match(/^\d{4}-\d\d-\d\d[T ]\d\d:\d\d:\d\d(?:\.(\d{1,6}))?(?:Z|[+-]\d\d:\d\d)$/);
  return Boolean(match && !/[1-9]/.test((match[1] ?? '').slice(3))
    && Number.isFinite(Date.parse(serverTime)) && Date.parse(serverTime) === Date.parse(requested));
}
function matches(row: DogEventRecord | null, operation: DogEventOperation): boolean {
  return Boolean(isObject(row) && keysAre(row, ['id', 'dog_id', 'event_type', 'occurred_at', 'occurred_on', 'weight_kg', 'duration_minutes', 'description', 'accident_kinds'])
    && row.occurred_on === null && row.weight_kg === null && row.id === operation.id && row.dog_id === operation.dog_id && row.event_type === operation.event_type
    && sameTimestamp(row.occurred_at, operation.occurred_at)
    && row.duration_minutes === operation.duration_minutes && row.description === operation.description
    && same(row.accident_kinds, operation.accident_kinds));
}
export function resolveAttempt(snapshot: QueueSnapshot, scope: QueueScope, capacity: number, lease: string, expectedRevision: number, eventId: string, outcome: 'unknown' | 'rejected' | 'confirmed', row: DogEventRecord | null): QueueResult<QueueProposal> {
  const checked = validateSnapshot(snapshot, scope, capacity);
  if (!checked.ok) return checked;
  const [head, ...tail] = checked.value.items;
  if (!head || head.status !== 'attempting' || head.lease !== lease || head.operation.id !== eventId
    || checked.value.revision !== expectedRevision) return fail('stale-lease');
  if (outcome === 'confirmed') return matches(row, head.operation) ? proposal(checked.value, tail, 'confirmed', lease, row) : fail('unconfirmed');
  if (outcome !== 'unknown' && outcome !== 'rejected') return fail('invalid-outcome');
  return proposal(checked.value, [{ ...head, status: outcome, lease: null }, ...tail]);
}
export function reconcileUnknown(snapshot: QueueSnapshot, scope: QueueScope, capacity: number, expectedRevision: number, eventId: string, row: DogEventRecord | null): QueueResult<QueueProposal> {
  const checked = validateSnapshot(snapshot, scope, capacity);
  if (!checked.ok) return checked;
  const [head, ...tail] = checked.value.items;
  if (!head || head.status !== 'unknown' || checked.value.revision !== expectedRevision || head.operation.id !== eventId) return fail('not-unknown');
  return matches(row, head.operation) ? proposal(checked.value, tail, 'confirmed', null, row) : fail('unconfirmed');
}
/** Adapter must supply the exact snapshot it actually committed, not merely a successful call. */
export function acknowledge(current: QueueSnapshot, proposalValue: QueueProposal, persisted: unknown, scope: QueueScope, capacity: number): QueueResult<{ snapshot: QueueSnapshot; effect: QueueProposal['effect']; operation: DogEventOperation | null }> {
  const restarting = validScope(current?.scope) && validScope(scope) && current.scope.ownerId === scope.ownerId
    && current.scope.dogId === scope.dogId && current.scope.generation !== scope.generation;
  const base = validateSnapshot(current, restarting ? current.scope : scope, capacity);
  const next = validateSnapshot(persisted, scope, capacity);
  if (!base.ok || !next.ok || !same(base.value, proposalValue.base) || !same(next.value, proposalValue.next)
    || next.value.revision !== base.value.revision + 1) return fail('stale-or-unverified-ack');
  const head = base.value.items[0];
  const candidates: QueueResult<QueueProposal>[] = [];
  if (proposalValue.effect === 'send' && proposalValue.lease) candidates.push(beginAttempt(base.value, scope, capacity, proposalValue.lease));
  if (proposalValue.effect === 'confirmed' && head?.status === 'attempting' && proposalValue.lease) {
    candidates.push(resolveAttempt(base.value, scope, capacity, proposalValue.lease, base.value.revision, head.operation.id, 'confirmed', proposalValue.proof));
  }
  if (proposalValue.effect === 'confirmed' && head?.status === 'unknown') candidates.push(reconcileUnknown(base.value, scope, capacity, base.value.revision, head.operation.id, proposalValue.proof));
  if (proposalValue.effect === 'none') {
    if (restarting) candidates.push(recoverAfterRestart(base.value, scope, capacity));
    else candidates.push(cancelHead(base.value, scope, capacity));
    if (head?.status === 'attempting' && head.lease) {
      candidates.push(resolveAttempt(base.value, scope, capacity, head.lease, base.value.revision, head.operation.id, 'unknown', null), resolveAttempt(base.value, scope, capacity, head.lease, base.value.revision, head.operation.id, 'rejected', null));
    }
    if (next.value.items.length === base.value.items.length + 1) candidates.push(enqueue(base.value, scope, capacity, next.value.items[next.value.items.length - 1].operation));
  }
  if (!candidates.some((candidate) => candidate.ok && same(candidate.value, proposalValue))) return fail('invalid-proposal');
  return ok({ snapshot: next.value, effect: proposalValue.effect, operation: proposalValue.effect === 'send' ? clone(next.value.items[0].operation) : null });
}
