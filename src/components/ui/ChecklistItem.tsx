import { MotionPressable } from './Motion';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useReducedMotion } from './Motion';
export function ChecklistItem({ label, checked, confirmed = false, onPress, disabled = false }: { label: string; checked: boolean; confirmed?: boolean; onPress: () => void; disabled?: boolean }) {
  const reduced = useReducedMotion();
  const [checkScale] = useState(() => new Animated.Value(1));
  const firstCommit = useRef(true);
  const previousChecked = useRef(checked);
  const awaitingConfirmation = useRef(false);
  useEffect(() => {
    if (firstCommit.current) {
      firstCommit.current = false;
      previousChecked.current = checked;
      return;
    }
    if (!previousChecked.current && checked) awaitingConfirmation.current = true;
    if (!checked) awaitingConfirmation.current = false;
    previousChecked.current = checked;
    checkScale.stopAnimation();
    const becameConfirmed = checked && confirmed && awaitingConfirmation.current;
    if (!checked || !becameConfirmed || reduced) {
      if (becameConfirmed) awaitingConfirmation.current = false;
      checkScale.setValue(1);
      return;
    }
    awaitingConfirmation.current = false;
    checkScale.setValue(0.65);
    const animation = Animated.timing(checkScale, { toValue: 1, duration: tokens.motion.check, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [checked, checkScale, confirmed, reduced]);
  return <MotionPressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked, disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.row, pressed && !disabled && styles.pressed, disabled && styles.disabled]}><Animated.View style={{ transform: [{ scale: checkScale }] }}><Ionicons name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={tokens.size.iconMd} color={checked ? tokens.colors.success : tokens.colors.textSecondary} /></Animated.View><Text style={styles.label}>{label}</Text></MotionPressable>;
}
const styles = StyleSheet.create({ row: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, paddingVertical: tokens.spacing.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong, borderRadius: tokens.radius.md, paddingHorizontal: tokens.spacing.sm }, label: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 }, pressed: { backgroundColor: tokens.colors.selectedSurface }, disabled: { opacity: 0.55 } });
