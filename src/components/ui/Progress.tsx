import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useReducedMotion } from './Motion';
export function Progress({ value, label, light = false }: { value: number; label: string; light?: boolean }) {
  const bounded = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(bounded));
  const previous = useRef(bounded);
  useEffect(() => {
    const changed = previous.current !== bounded;
    previous.current = bounded;
    progress.stopAnimation();
    if (reduced) { progress.setValue(bounded); return; }
    if (!changed) return;
    const animation = Animated.timing(progress, { toValue: bounded, duration: tokens.motion.progress, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [bounded, progress, reduced]);
  const width = progress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: bounded }} style={styles.wrap}><View style={[styles.track, light && styles.lightTrack]}><Animated.View style={[styles.fill, light && styles.lightFill, { width }]} /></View><Text style={[styles.label, light && styles.lightLabel]}>{label}</Text></View>;
}
const styles = StyleSheet.create({ wrap: { alignSelf: 'stretch', gap: tokens.spacing.sm }, track: { height: tokens.size.progress, overflow: 'hidden', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.border }, fill: { height: tokens.size.progress, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.success }, lightTrack: { backgroundColor: tokens.colors.primaryPressed }, lightFill: { backgroundColor: tokens.colors.onPrimary }, lightLabel: { color: tokens.colors.onPrimary }, label: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 } });
