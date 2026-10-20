import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { mainSwipeDirection, shouldClaimMainSwipe } from './main-swipe-rules';

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
    <View style={styles.surface} {...(enabled ? gestureController.responder.panHandlers : {})}>{children}</View>
  </HorizontalGestureExclusionContext.Provider>;
}

function createGestureController(enabled: boolean, onSwipe: (direction: 'left' | 'right') => void) {
  let excluded = false;
  return {
    setExcluded(active: boolean) {
      excluded = active;
    },
    responder: PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gesture) => enabled && !excluded && shouldClaimMainSwipe(gesture.dx, gesture.dy),
      onMoveShouldSetPanResponder: (_, gesture) => enabled && !excluded && shouldClaimMainSwipe(gesture.dx, gesture.dy),
      onPanResponderTerminationRequest: (_, gesture) => !shouldClaimMainSwipe(gesture.dx, gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        if (excluded) return;
        const direction = mainSwipeDirection(gesture.dx, gesture.dy, gesture.vx);
        if (direction) onSwipe(direction);
      },
    }),
  };
}

const styles = StyleSheet.create({ surface: { flexGrow: 1 } });

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
