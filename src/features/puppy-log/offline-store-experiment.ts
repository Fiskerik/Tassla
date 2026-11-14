/** Synthetic, in-process experiment only; it is not an atomic or durable store. */
export const SYNTHETIC_KEY = 'tassla.synthetic.store.experiment';
export const SYNTHETIC_OPTIONS = Object.freeze({ keychainService: 'tassla-synthetic-experiment', requireAuthentication: false });
export type SyntheticScope = 'fixture-a' | 'fixture-b';
export type SyntheticSnapshot = { version: 1; scope: SyntheticScope; revision: number; items: ('a' | 'b' | 'c')[] };
export type SyntheticAdapter = {
  getItemAsync(key: string, options: typeof SYNTHETIC_OPTIONS): Promise<string | null>;
  setItemAsync(key: string, value: string, options: typeof SYNTHETIC_OPTIONS): Promise<void>;
  deleteItemAsync(key: string, options: typeof SYNTHETIC_OPTIONS): Promise<void>;
};
export type Observation = { status: 'absent'; raw: null } | { status: 'value'; raw: string; value: SyntheticSnapshot }
  | { status: 'corrupt' | 'scope-mismatch' | 'api-error' | 'stale' | 'invalid' };
type MutationResult = { status: 'observed' | 'conflict' | 'uncertain' | 'blocked' | 'invalid' | 'corrupt' | 'scope-mismatch' | 'api-error' | 'stale' };

let tail: Promise<void> = Promise.resolve();
let uncertain: { scope: SyntheticScope; adapter: SyntheticAdapter } | null = null;
let recovery: { observation: Observation; raw: string | null } | null = null;
function serial<T>(run: () => Promise<T>): Promise<T> {
  const result = tail.then(run, run);
  tail = result.then(() => undefined, () => undefined);
  return result;
}
function isSnapshot(value: unknown, maxBytes: number): value is SyntheticSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 1024) return false;
  const row = value as Record<string, unknown>;
  return Object.keys(row).sort().join(',') === 'items,revision,scope,version' && row.version === 1
    && (row.scope === 'fixture-a' || row.scope === 'fixture-b') && Number.isSafeInteger(row.revision)
    && (row.revision as number) >= 0 && (row.revision as number) <= 9999
    && Array.isArray(row.items) && row.items.length <= 3 && row.items.every((item) => item === 'a' || item === 'b' || item === 'c')
    && JSON.stringify(value).length <= maxBytes;
}
function inspect(raw: string | null, scope: SyntheticScope, maxBytes: number): Observation {
  if (raw === null) return { status: 'absent', raw: null };
  try {
    const value: unknown = JSON.parse(raw);
    if (!isSnapshot(value, maxBytes) || raw.length > maxBytes) return { status: 'corrupt' };
    if (value.scope !== scope) return { status: 'scope-mismatch' };
    return { status: 'value', raw, value };
  } catch { return { status: 'corrupt' }; }
}
export function createSyntheticStore(adapter: SyntheticAdapter, maxBytes: number) {
  const readRaw = async () => adapter.getItemAsync(SYNTHETIC_KEY, SYNTHETIC_OPTIONS);
  async function observe(scope: SyntheticScope, current: () => boolean): Promise<Observation> {
    if ((scope !== 'fixture-a' && scope !== 'fixture-b') || !Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 1024) return { status: 'invalid' };
    if (!current()) return { status: 'stale' };
    try {
      const raw = await readRaw();
      return current() ? inspect(raw, scope, maxBytes) : { status: 'stale' };
    } catch { return { status: 'api-error' }; }
  }
  return {
    read(scope: SyntheticScope, current: () => boolean): Promise<Observation> {
      return serial(async () => {
        const observation = await observe(scope, current);
        if (uncertain?.adapter === adapter && uncertain.scope === scope && (observation.status === 'value' || observation.status === 'absent')) {
          recovery = { observation, raw: observation.raw };
        }
        return observation;
      });
    },
    /** Explicitly resolves an uncertain intent only after a fresh matching observation. */
    resolveUncertain(scope: SyntheticScope, observation: Observation, current: () => boolean): Promise<MutationResult> {
      return serial(async () => {
        if (uncertain?.scope !== scope || uncertain.adapter !== adapter || recovery?.observation !== observation) return { status: 'invalid' };
        const expectedObservedRaw = recovery.raw;
        const result = await observe(scope, current);
        if (result.status !== 'value' && result.status !== 'absent') return { status: result.status };
        if (result.raw !== expectedObservedRaw) return { status: 'conflict' };
        uncertain = null;
        recovery = null;
        return { status: 'observed' };
      });
    },
    commit(scope: SyntheticScope, expectedRaw: string | null, next: SyntheticSnapshot, current: () => boolean): Promise<MutationResult> {
      let raw: string;
      let immutable: SyntheticSnapshot;
      try {
        if (!isSnapshot(next, maxBytes) || next.scope !== scope) return Promise.resolve({ status: 'invalid' });
        raw = JSON.stringify(next);
        const parsed: unknown = JSON.parse(raw);
        if (!isSnapshot(parsed, maxBytes) || parsed.scope !== scope) return Promise.resolve({ status: 'invalid' });
        immutable = parsed;
      } catch { return Promise.resolve({ status: 'invalid' }); }
      return serial(async () => {
        if (uncertain !== null) return { status: 'blocked' };
        const before = await observe(scope, current);
        if (before.status !== 'value' && before.status !== 'absent') return { status: before.status };
        if (before.raw !== expectedRaw) return { status: 'conflict' };
        const expectedRevision = before.status === 'absent' ? 1 : before.value.revision + 1;
        if (immutable.revision !== expectedRevision) return { status: 'invalid' };
        if (!current()) return { status: 'stale' };
        try {
          await adapter.setItemAsync(SYNTHETIC_KEY, raw, SYNTHETIC_OPTIONS);
          if (!current() || await readRaw() !== raw || !current()) { uncertain = { scope, adapter }; recovery = null; return { status: 'uncertain' }; }
          return { status: 'observed' };
        } catch { uncertain = { scope, adapter }; recovery = null; return { status: 'uncertain' }; }
      });
    },
    clear(scope: SyntheticScope, expectedRaw: string, current: () => boolean): Promise<MutationResult> {
      return serial(async () => {
        if (uncertain !== null) return { status: 'blocked' };
        const before = await observe(scope, current);
        if (before.status !== 'value' && before.status !== 'absent') return { status: before.status };
        if (before.raw !== expectedRaw) return { status: 'conflict' };
        if (!current()) return { status: 'stale' };
        try {
          await adapter.deleteItemAsync(SYNTHETIC_KEY, SYNTHETIC_OPTIONS);
          if (!current() || await readRaw() !== null || !current()) { uncertain = { scope, adapter }; recovery = null; return { status: 'uncertain' }; }
          return { status: 'observed' };
        } catch { uncertain = { scope, adapter }; recovery = null; return { status: 'uncertain' }; }
      });
    },
  };
}
