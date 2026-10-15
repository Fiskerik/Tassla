import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, type PressableProps } from 'react-native';
import { tokens } from '../../theme/tokens';

export function useReducedMotionPreference() {
  const [preference, setPreference] = useState({ reduced: true, ready: false });
  useEffect(() => {
    let active = true;
    let receivedChange = false;
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', (reduced) => {
      receivedChange = true;
      if (active) setPreference({ reduced, ready: true });
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (active && !receivedChange) setPreference({ reduced, ready: true });
    }).catch(() => {
      if (active && !receivedChange) setPreference({ reduced: true, ready: true });
    });
    return () => { active = false; listener.remove(); };
  }, []);
  return preference;
}

export function useReducedMotion() {
  return useReducedMotionPreference().reduced;
}
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MotionPressable({ style, onPressIn, onPressOut, onHoverIn, onHoverOut, ...props }: PressableProps) {
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [wasDisabled, setWasDisabled] = useState(false);
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (props.disabled) {
      scale.stopAnimation();
      scale.setValue(1);
    } else if (reduced) {
      scale.stopAnimation();
      scale.setValue(1);
    }
    return () => scale.stopAnimation();
  }, [props.disabled, reduced, scale]);
  if (props.disabled && !wasDisabled) {
    setPressed(false);
    setHovered(false);
    setWasDisabled(true);
  } else if (!props.disabled && wasDisabled) {
    setWasDisabled(false);
  }
  function animate(pressed: boolean) {
    scale.stopAnimation();
    Animated.timing(scale, {
      toValue: pressed && !reduced ? tokens.motion.pressedScale : 1,
      duration: reduced ? 0 : pressed ? tokens.motion.press : tokens.motion.release,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }
  const resolvedStyle = typeof style === 'function'
    ? style({ pressed: pressed && !props.disabled, hovered: hovered && !props.disabled })
    : style;
  return <AnimatedPressable {...props}
    onPressIn={(event) => { const isPressed = !props.disabled; setPressed(isPressed); animate(isPressed); onPressIn?.(event); }}
    onPressOut={(event) => { setPressed(false); animate(false); onPressOut?.(event); }}
    onHoverIn={(event) => { const isHovered = !props.disabled; setHovered(isHovered); onHoverIn?.(event); }}
    onHoverOut={(event) => { setHovered(false); onHoverOut?.(event); }}
    style={[resolvedStyle, { transform: [{ scale }] }]} />;
}

export function ScreenTransition({ children, transitionKey, direction = 'forward', axis = 'y' }: {
  children: ReactNode; transitionKey: string; direction?: 'forward' | 'backward'; axis?: 'x' | 'y';
}) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(1));
  useEffect(() => {
    progress.stopAnimation();
    if (reduced) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: tokens.motion.enter, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced, transitionKey]);
  const shift = direction === 'forward' ? tokens.motion.distance : -tokens.motion.distance;
  const translation = reduced ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [shift, 0] });
  return <Animated.View key={transitionKey} style={{ opacity: progress, transform: [axis === 'x' ? { translateX: translation } : { translateY: translation }] }}>{children}</Animated.View>;
}
