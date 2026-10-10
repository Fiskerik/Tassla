import { useMemo, type ReactNode } from 'react';
import { PanResponder, View } from 'react-native';
import { tokens } from '../../theme/tokens';

const SWIPE_DISTANCE = tokens.size.touchMin;

export function MainSwipeNavigation({ enabled, onSwipe, children }: {
  enabled: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  children: ReactNode;
}) {
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => enabled
      && Math.abs(gesture.dx) > SWIPE_DISTANCE
      && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) < SWIPE_DISTANCE || Math.abs(gesture.dx) <= Math.abs(gesture.dy)) return;
      onSwipe(gesture.dx < 0 ? 'left' : 'right');
    },
  }), [enabled, onSwipe]);

  return <View {...(enabled ? responder.panHandlers : {})}>{children}</View>;
}
