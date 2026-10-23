import { MotionPressable, useReducedMotion } from './Motion';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, type TextStyle } from 'react-native';
import { tokens } from '../../theme/tokens';
import { ThemedIcon, type ThemedIconTone } from './ThemedIcon';

type ChecklistItemVariant = 'standalone' | 'grouped';
type ChecklistIcon = ComponentProps<typeof Ionicons>['name'];

export function ChecklistItem({ label, checked, confirmed = false, onPress, disabled = false, pending = false, variant = 'standalone', leadingIcon, leadingIconTone }: { label: string; checked: boolean; confirmed?: boolean; onPress: () => void; disabled?: boolean; pending?: boolean; variant?: ChecklistItemVariant; leadingIcon?: ChecklistIcon; leadingIconTone?: ThemedIconTone }) {
  const reduced = useReducedMotion();
  const [checkScale] = useState(() => new Animated.Value(1));
  const firstCommit = useRef(true);
  const checkIcon = variant === 'grouped' ? checked ? 'checkbox' : 'square-outline' : checked ? 'checkmark-circle' : 'ellipse-outline';
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
  return <MotionPressable accessibilityRole="checkbox" accessibilityLabel={pending ? `${label}, sparar` : label} accessibilityState={{ checked, disabled, busy: pending }} aria-checked={checked} aria-busy={pending} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.row, variant === 'grouped' && styles.groupedRow, pressed && !disabled && styles.pressed, disabled && !pending && styles.disabled]}><Animated.View style={{ transform: [{ scale: checkScale }] }}><Ionicons name={checkIcon} size={tokens.size.iconMd} color={checked ? tokens.colors.success : tokens.colors.textSecondary} /></Animated.View>{leadingIcon ? leadingIconTone ? <ThemedIcon name={leadingIcon} tone={leadingIconTone} size="small" surface={false} /> : <Ionicons name={leadingIcon} size={tokens.size.iconSm} color={tokens.colors.destination.knowledge.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}<Text style={[styles.label, Platform.OS === 'web' ? webLongWordWrap : null]}>{label}</Text>{pending ? <Text style={styles.pendingLabel}>Sparar…</Text> : null}</MotionPressable>;
}
const webLongWordWrap = { overflowWrap: 'anywhere' } as unknown as TextStyle;
const styles = StyleSheet.create({ row: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, paddingVertical: tokens.spacing.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong, borderRadius: tokens.radius.md, paddingHorizontal: tokens.spacing.sm }, groupedRow: { flex: 1, minWidth: 0, borderWidth: 0, borderRadius: 0, paddingHorizontal: 0 }, label: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 }, pendingLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 0 }, pressed: { backgroundColor: tokens.colors.selectedSurface }, disabled: { opacity: 0.55 } });
