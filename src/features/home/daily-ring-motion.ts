export type RingActivity = { id: string; completed: boolean };
export type RingSnapshot = {
  scope: string;
  complete: boolean;
  activities: readonly RingActivity[];
  mutationKey: string;
  busy: boolean;
  error: boolean;
  refreshing: boolean;
  reduced: boolean;
};
type Intent = { scope: string; itemId: string; mutationKey: string; before: Map<string, boolean>; sawPending: boolean };

/** Keep visual feedback tied to one user request and its confirmed readback. */
export function createDailyRingMotionIntent() {
  let intent: Intent | null = null;
  return {
    request(snapshot: RingSnapshot, itemId: string, mutationKey: string, target: boolean) {
      intent = null;
      const before = new Map(snapshot.activities.map((item) => [item.id, item.completed]));
      if (!target || !snapshot.scope || !snapshot.complete || snapshot.busy || snapshot.error || snapshot.refreshing || snapshot.reduced
        || !mutationKey || before.size !== snapshot.activities.length || before.get(itemId) !== false) return;
      intent = { scope: snapshot.scope, itemId, mutationKey, before, sawPending: false };
    },
    observe(snapshot: RingSnapshot): { from: number; to: number } | null {
      const current = intent;
      if (!current) return null;
      const values = new Map(snapshot.activities.map((item) => [item.id, item.completed]));
      if (snapshot.scope !== current.scope || !snapshot.complete || snapshot.error || snapshot.reduced
        || values.size !== current.before.size || values.size !== snapshot.activities.length
        || [...current.before].some(([id, done]) => !values.has(id) || (id !== current.itemId && values.get(id) !== done))) {
        intent = null; return null;
      }
      if (snapshot.busy) {
        if (snapshot.mutationKey !== current.mutationKey) intent = null;
        else current.sawPending = true;
        return null;
      }
      if (snapshot.refreshing) return null;
      if (!current.sawPending) {
        if (values.get(current.itemId) !== false) intent = null;
        return null;
      }
      intent = null;
      if (snapshot.mutationKey !== current.mutationKey || values.get(current.itemId) !== true) return null;
      const completed = [...current.before.values()].filter(Boolean).length;
      return { from: completed / values.size, to: (completed + 1) / values.size };
    },
    reset() { intent = null; },
  };
}
