/** Inactive storage core. Ports below are contracts, not native implementations. */
import { inspectProcessedJpeg, type JpegLimits } from './jpeg-policy';

type Scope = { ownerId: string; dogId: string; generation: string };
type Entry = { dogId: string; photoId: string };
type Manifest = { version: 1; ownerId: string; entries: Entry[] };
export type PhotoPorts = {
  /** An ambiguous or unreadable native result must be unknown, never absent. */
  readManifest(ownerId: string): Promise<{ kind: 'absent' } | { kind: 'value'; raw: string } | { kind: 'unknown' }>;
  /** conflict promises no write occurred; an ambiguous outcome must throw. */
  compareAndSwapManifest(ownerId: string, expected: string | null, next: string): Promise<'written' | 'conflict'>;
  /** Must use the supplied owner's and dog's private scope, allow scoped enumeration and never overwrite. */
  createExclusive(ownerId: string, dogId: string, photoId: string, bytes: Uint8Array): Promise<'created' | 'exists'>;
  readPhoto(ownerId: string, dogId: string, photoId: string): Promise<Uint8Array>;
};
type Status = 'observed' | 'reconciled-previous' | 'reconciled-next' | 'staging-observed' | 'absent' | 'invalid' | 'conflict' | 'stale' | 'uncertain' | 'error' | 'blocked';
type Result = { status: Status; bytes?: Uint8Array };
type Pending = { kind: 'manifest'; ports: PhotoPorts; dogId: string; before: string | null; after: string }
  | { kind: 'staging'; ports: PhotoPorts; dogId: string; photoId: string; bytes: Uint8Array };
const queues = new Map<string, Promise<void>>();
const pending = new Map<string, Pending>();
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const validScope = (scope: Scope) => uuid(scope.ownerId) && uuid(scope.dogId) && typeof scope.generation === 'string' && scope.generation.length > 0 && scope.generation.length <= 128;
const keys = (object: Record<string, unknown>, expected: string[]) => Object.keys(object).sort().join(',') === expected.slice().sort().join(',');
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const equalBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((value, index) => value === b[index]);
function serialize<T>(owner: string, run: () => Promise<T>): Promise<T> {
  const previous = queues.get(owner) ?? Promise.resolve();
  const result = previous.then(run, run);
  const finished = result.then(() => undefined, () => undefined);
  queues.set(owner, finished);
  void finished.then(() => { if (queues.get(owner) === finished) queues.delete(owner); });
  return result;
}
function parseManifest(raw: string | null, ownerId: string): Manifest | null {
  if (raw === null) return { version: 1, ownerId, entries: [] };
  if (typeof raw !== 'string' || raw.length > 5000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!object(value) || !keys(value, ['version', 'ownerId', 'entries']) || value.version !== 1 || value.ownerId !== ownerId
      || !Array.isArray(value.entries) || value.entries.length > 32) return null;
    const dogs = new Set<string>();
    for (const entry of value.entries) {
      if (!object(entry) || !keys(entry, ['dogId', 'photoId']) || !uuid(entry.dogId) || !uuid(entry.photoId)
        || dogs.has(entry.dogId)) return null;
      dogs.add(entry.dogId);
    }
    return value as Manifest;
  } catch { return null; }
}
function captureScope(scope: Scope): Scope | null {
  if (!scope || !validScope(scope)) return null;
  return Object.freeze({ ownerId: scope.ownerId, dogId: scope.dogId, generation: scope.generation });
}
export function createPhotoStore(ports: PhotoPorts, requestedLimits: JpegLimits, nextId: () => string) {
  const limits = Object.freeze({ maxBytes: requestedLimits.maxBytes, maxPixels: requestedLimits.maxPixels, maxDimension: requestedLimits.maxDimension });
  const readManifest = async (ownerId: string): Promise<string | null> => {
    const result = await ports.readManifest(ownerId);
    if (result?.kind === 'absent') return null;
    if (result?.kind === 'value' && typeof result.raw === 'string') return result.raw;
    throw new Error('Manifest unavailable');
  };
  return {
    save(scope: Scope, input: Uint8Array, isCurrent: (captured: Scope) => boolean): Promise<Result> {
      const captured = captureScope(scope);
      if (!captured || !(input instanceof Uint8Array) || !Number.isSafeInteger(limits.maxBytes) || limits.maxBytes < 4 || limits.maxBytes > 16_000_000
        || !Number.isSafeInteger(limits.maxPixels) || limits.maxPixels < 1 || limits.maxPixels > 100_000_000
        || !Number.isSafeInteger(limits.maxDimension) || limits.maxDimension < 1 || limits.maxDimension > 65_535 || input.length > limits.maxBytes) return Promise.resolve({ status: 'invalid' });
      const bytes = Uint8Array.from(input);
      if (!inspectProcessedJpeg(bytes, limits).ok) return Promise.resolve({ status: 'invalid' });
      let photoId: string;
      try { photoId = nextId(); } catch { return Promise.resolve({ status: 'error' }); }
      if (!uuid(photoId)) return Promise.resolve({ status: 'invalid' });
      return serialize(captured.ownerId, async () => {
        if (pending.has(captured.ownerId)) return { status: 'blocked' };
        if (!isCurrent(captured)) return { status: 'stale' };
        let before: string | null;
        try { before = await readManifest(captured.ownerId); } catch { return { status: 'error' }; }
        if (!isCurrent(captured)) return { status: 'stale' };
        const manifest = parseManifest(before, captured.ownerId);
        if (!manifest) return { status: 'error' };
        if (manifest.entries.some((entry) => entry.dogId === captured.dogId && entry.photoId === photoId)) return { status: 'conflict' };
        if (!manifest.entries.some((entry) => entry.dogId === captured.dogId) && manifest.entries.length >= 32) return { status: 'invalid' };
        const staging: Pending = { kind: 'staging', ports, dogId: captured.dogId, photoId, bytes };
        let created: 'created' | 'exists';
        try { created = await ports.createExclusive(captured.ownerId, captured.dogId, photoId, bytes.slice()); }
        catch { pending.set(captured.ownerId, staging); return isCurrent(captured) ? { status: 'uncertain' } : { status: 'stale' }; }
        if (!isCurrent(captured)) { pending.set(captured.ownerId, staging); return { status: 'stale' }; }
        if (created === 'exists') return { status: 'conflict' };
        if (created !== 'created') { pending.set(captured.ownerId, staging); return { status: 'uncertain' }; }
        try {
          const copy = await ports.readPhoto(captured.ownerId, captured.dogId, photoId);
          if (!isCurrent(captured)) { pending.set(captured.ownerId, staging); return { status: 'stale' }; }
          if (!(copy instanceof Uint8Array) || !equalBytes(bytes, copy)) { pending.set(captured.ownerId, staging); return { status: 'uncertain' }; }
        } catch { pending.set(captured.ownerId, staging); return isCurrent(captured) ? { status: 'uncertain' } : { status: 'stale' }; }
        const after = JSON.stringify({ version: 1, ownerId: captured.ownerId, entries: [
          ...manifest.entries.filter((entry) => entry.dogId !== captured.dogId), { dogId: captured.dogId, photoId },
        ].sort((a, b) => a.dogId.localeCompare(b.dogId)) });
        const possible: Pending = { kind: 'manifest', ports, dogId: captured.dogId, before, after };
        try {
          const result = await ports.compareAndSwapManifest(captured.ownerId, before, after);
          if (!isCurrent(captured)) { pending.set(captured.ownerId, possible); return { status: 'uncertain' }; }
          if (result === 'conflict') return { status: 'conflict' };
          if (result !== 'written' || await readManifest(captured.ownerId) !== after || !isCurrent(captured)) {
            pending.set(captured.ownerId, possible); return { status: 'uncertain' };
          }
          return { status: 'observed' };
        } catch { pending.set(captured.ownerId, possible); return { status: 'uncertain' }; }
      });
    },
    read(scope: Scope, isCurrent: (captured: Scope) => boolean): Promise<Result> {
      const captured = captureScope(scope);
      if (!captured) return Promise.resolve({ status: 'invalid' });
      return serialize(captured.ownerId, async () => {
        if (pending.has(captured.ownerId)) return { status: 'blocked' };
        if (!isCurrent(captured)) return { status: 'stale' };
        try {
          const raw = await readManifest(captured.ownerId);
          if (!isCurrent(captured)) return { status: 'stale' };
          const manifest = parseManifest(raw, captured.ownerId);
          if (!manifest) return { status: 'error' };
          const entry = manifest.entries.find((item) => item.dogId === captured.dogId);
          if (!entry) return { status: 'absent' };
          const bytes = await ports.readPhoto(captured.ownerId, captured.dogId, entry.photoId);
          if (!isCurrent(captured)) return { status: 'stale' };
          if (!(bytes instanceof Uint8Array) || !inspectProcessedJpeg(bytes, limits).ok) return { status: 'error' };
          return { status: 'observed', bytes: Uint8Array.from(bytes) };
        } catch { return isCurrent(captured) ? { status: 'error' } : { status: 'stale' }; }
      });
    },
    reconcile(scope: Scope, isCurrent: (captured: Scope) => boolean): Promise<Result> {
      const captured = captureScope(scope);
      if (!captured) return Promise.resolve({ status: 'invalid' });
      return serialize(captured.ownerId, async () => {
        const unresolved = pending.get(captured.ownerId);
        if (!unresolved || unresolved.ports !== ports || unresolved.dogId !== captured.dogId) return { status: 'blocked' };
        if (!isCurrent(captured)) return { status: 'stale' };
        try {
          if (unresolved.kind === 'staging') {
            const actual = await ports.readPhoto(captured.ownerId, captured.dogId, unresolved.photoId);
            if (!isCurrent(captured)) return { status: 'stale' };
            if (!(actual instanceof Uint8Array) || !equalBytes(actual, unresolved.bytes)) return { status: 'conflict' };
            pending.delete(captured.ownerId);
            return { status: 'staging-observed' };
          }
          const actual = await readManifest(captured.ownerId);
          if (!isCurrent(captured)) return { status: 'stale' };
          if (!parseManifest(actual, captured.ownerId) || (actual !== unresolved.before && actual !== unresolved.after)) return { status: 'conflict' };
          pending.delete(captured.ownerId);
          return { status: actual === unresolved.before ? 'reconciled-previous' : 'reconciled-next' };
        } catch { return { status: 'error' }; }
      });
    },
  };
}
