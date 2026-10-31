/** An ephemeral request; loading saved state alone never arms feedback. */
export function createConfirmationIntent() {
  let key: string | undefined;
  let waiting = false;
  return {
    request(nextKey: string | undefined, target: boolean) {
      key = nextKey;
      waiting = Boolean(nextKey) && target;
    },
    consume(nextKey: string | undefined, checked: boolean, confirmed: boolean): boolean {
      if (key !== nextKey) { key = nextKey; waiting = false; }
      if (!waiting || !checked || !confirmed) return false;
      waiting = false;
      return true;
    },
    reset() { key = undefined; waiting = false; },
  };
}
