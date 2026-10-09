import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, type PressableProps } from 'react-native';
import { tokens } from '../../theme/tokens';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduced(value); }).catch(() => undefined);
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; listener.remove(); };
  }, []);
  return reduced;
}
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MotionPressable({ style, onPressIn, onPressOut, ...props }: PressableProps) {
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduced || props.disabled) { scale.stopAnimation(); scale.setValue(1); }
    return () => scale.stopAnimation();
  }, [props.disabled, reduced, scale]);
  function animate(pressed: boolean) {
    scale.stopAnimation();
    Animated.timing(scale, {
      toValue: pressed && !reduced ? tokens.motion.pressedScale : 1,
      duration: reduced ? 0 : pressed ? tokens.motion.press : tokens.motion.release,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }
  return <AnimatedPressable {...props}
    onPressIn={(event) => { setPressed(true); animate(true); onPressIn?.(event); }}
    onPressOut={(event) => { setPressed(false); animate(false); onPressOut?.(event); }}
    style={[typeof style === 'function' ? style({ pressed: pressed && !props.disabled }) : style, { transform: [{ scale }] }]} />;
}

export function ScreenTransition({ children, transitionKey }: { children: ReactNode; transitionKey: string }) {
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
  return <Animated.View key={transitionKey} style={{ opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [tokens.motion.distance, 0] }) }] }}>{children}</Animated.View>;
}
