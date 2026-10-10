import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useReducedMotionPreference } from './Motion';

export function DogMascot({ reactionKey }: { reactionKey: string | null }) {
  const { reduced: reducedMotion, ready: motionReady } = useReducedMotionPreference();
  const [scale] = useState(() => new Animated.Value(1));
  const playedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!reactionKey || !motionReady) return;
    if (playedKey.current === reactionKey) {
      if (reducedMotion) { scale.stopAnimation(); scale.setValue(1); }
      return;
    }
    playedKey.current = reactionKey;
    scale.stopAnimation();
    if (reducedMotion) { scale.setValue(1); return; }
    scale.setValue(0.88);
    const animation = Animated.sequence([
      Animated.spring(scale, { toValue: 1.08, speed: 22, bounciness: 7, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 18, bounciness: 4, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [motionReady, reactionKey, reducedMotion, scale]);

  if (!reactionKey) return null;
  return <Animated.Image source={require('../../../assets/images/dog-mascot.png')} resizeMode="contain"
    accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.image, { transform: [{ scale }] }]} />;
}

const styles = StyleSheet.create({ image: { width: 56, height: 56, alignSelf: 'center', flexShrink: 0, marginHorizontal: tokens.spacing.xs } });
