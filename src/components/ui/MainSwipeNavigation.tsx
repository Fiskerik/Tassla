import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, View, type ReactNode } from 'react-native';
import { tokens } from '../../theme/tokens';

const SWIPE_DISTANCE = tokens.size.touchMin;

export function MainSwipeNavigation({ enabled, onSwipe, children }: {
  enabled: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  children: ReactNode;
}) {
  const enabledRef = useRef(enabled);
  const onSwipeRef = useRef(onSwipe);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { onSwipeRef.current = onSwipe; }, [onSwipe]);

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => enabledRef.current
      && Math.abs(gesture.dx) > SWIPE_DISTANCE
      && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) < SWIPE_DISTANCE || Math.abs(gesture.dx) <= Math.abs(gesture.dy)) return;
      onSwipeRef.current(gesture.dx < 0 ? 'left' : 'right');
    },
  }), []);

  return <View {...(enabled ? responder.panHandlers : {})}>{children}</View>;
}
