import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createConfirmationIntent } from './confirmation-intent';
import { playConfirmationHaptic } from './confirmation-haptics';

export function useConfirmedCheckFeedback(key: string | undefined, checked: boolean, confirmed: boolean, reduced: boolean) {
  const intent = useRef(createConfirmationIntent());
  const scope = useRef({ key, active: true, reduced });
  useLayoutEffect(() => {
    const currentScope = scope.current;
    const currentIntent = intent.current;
    currentScope.key = key;
    currentScope.active = true;
    currentIntent.reset();
    return () => { currentScope.active = false; currentIntent.reset(); };
  }, [key]);
  useLayoutEffect(() => { scope.current.reduced = reduced; }, [reduced]);
  useEffect(() => {
    if (!intent.current.consume(key, checked, confirmed)) return;
    // Consume silently while disabled so this event cannot play after a preference change.
    void playConfirmationHaptic(() => scope.current.active && scope.current.key === key && !scope.current.reduced);
  }, [checked, confirmed, key, reduced]);
  return useCallback((target: boolean) => {
    if (scope.current.active) intent.current.request(key, target);
  }, [key]);
}
