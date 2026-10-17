import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { PanResponder, View } from 'react-native';
import { tokens } from '../../theme/tokens';

const SWIPE_DISTANCE = tokens.size.touchMin;
const HorizontalGestureExclusionContext = createContext<((excluded: boolean) => void) | null>(null);

export function MainSwipeNavigation({ enabled, onSwipe, children }: {
  enabled: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  children: ReactNode;
}) {
  const gestureController = useMemo(() => createGestureController(enabled, onSwipe), [enabled, onSwipe]);

  useEffect(() => {
    if (!enabled) gestureController.setExcluded(false);
    return () => gestureController.setExcluded(false);
  }, [enabled, gestureController]);

  return <HorizontalGestureExclusionContext.Provider value={gestureController.setExcluded}>
    <View {...(enabled ? gestureController.responder.panHandlers : {})}>{children}</View>
  </HorizontalGestureExclusionContext.Provider>;
}

function createGestureController(enabled: boolean, onSwipe: (direction: 'left' | 'right') => void) {
  let excluded = false;
  const shouldClaimSwipe = (dx: number, dy: number) => enabled
    && !excluded
    && Math.abs(dx) > SWIPE_DISTANCE
    && Math.abs(dx) > Math.abs(dy) * 1.2;
  return {
    setExcluded(active: boolean) {
      excluded = active;
    },
    responder: PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gesture) => shouldClaimSwipe(gesture.dx, gesture.dy),
      onMoveShouldSetPanResponder: (_, gesture) => shouldClaimSwipe(gesture.dx, gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        if (excluded || Math.abs(gesture.dx) < SWIPE_DISTANCE || Math.abs(gesture.dx) <= Math.abs(gesture.dy)) return;
        onSwipe(gesture.dx < 0 ? 'left' : 'right');
      },
    }),
  };
}

export function HorizontalGestureRegion({ children }: { children: ReactNode }) {
  const setGestureExcluded = useContext(HorizontalGestureExclusionContext);
  const active = useRef(false);
  const finish = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    setGestureExcluded?.(false);
  }, [setGestureExcluded]);
  const start = useCallback(() => {
    if (active.current) return;
    active.current = true;
    setGestureExcluded?.(true);
  }, [setGestureExcluded]);

  useEffect(() => finish, [finish]);

  return <View onTouchStart={start} onTouchEnd={finish} onTouchCancel={finish}>{children}</View>;
}
