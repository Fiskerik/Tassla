import { useConfirmedCheckFeedback } from '../../feedback/use-confirmed-check-feedback';
import { MotionPressable, useReducedMotion } from './Motion';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, type TextStyle } from 'react-native';
import { tokens } from '../../theme/tokens';
import { ThemedIcon, type ThemedIconTone } from './ThemedIcon';

type ChecklistItemVariant = 'standalone' | 'grouped';
type ChecklistCompletionShape = 'circle' | 'square';
type ChecklistIcon = ComponentProps<typeof Ionicons>['name'];

export function ChecklistItem({ label, checked, confirmed = false, feedbackKey, onPress, disabled = false, pending = false, variant = 'standalone', completionShape, leadingIcon, leadingIconTone }: { label: string; checked: boolean; confirmed?: boolean; feedbackKey?: string; onPress: () => void; disabled?: boolean; pending?: boolean; variant?: ChecklistItemVariant; completionShape?: ChecklistCompletionShape; leadingIcon?: ChecklistIcon; leadingIconTone?: ThemedIconTone }) {
  const reduced = useReducedMotion();
  const [checkScale] = useState(() => new Animated.Value(1));
  const firstCommit = useRef(true);
  const previousIdentity = useRef(feedbackKey);
  const pressedIntent = useRef(false);
  const requestFeedback = useConfirmedCheckFeedback(feedbackKey, checked, confirmed && !pending, reduced);
  const markShape = completionShape ?? (variant === 'grouped' ? 'square' : 'circle');
  const checkIcon = markShape === 'square' ? checked ? 'checkbox' : 'square-outline' : checked ? 'checkmark-circle' : 'ellipse-outline';
  const checkSize = completionShape === 'circle' ? tokens.size.iconLg : tokens.size.iconMd;
  const previousChecked = useRef(checked);
  const awaitingConfirmation = useRef(false);
  useEffect(() => {
    const identityChanged = previousIdentity.current !== feedbackKey;
    previousIdentity.current = feedbackKey;
    if (firstCommit.current || identityChanged) {
      firstCommit.current = false;
      previousChecked.current = checked;
      awaitingConfirmation.current = false;
      pressedIntent.current = false;
      checkScale.stopAnimation();
      checkScale.setValue(1);
      return;
    }
    if (!previousChecked.current && checked && pressedIntent.current) awaitingConfirmation.current = true;
    if (!checked) awaitingConfirmation.current = false;
    previousChecked.current = checked;
    checkScale.stopAnimation();
    const becameConfirmed = checked && confirmed && awaitingConfirmation.current;
    if (becameConfirmed) pressedIntent.current = false;
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
  }, [checked, checkScale, confirmed, feedbackKey, reduced]);
  return <MotionPressable accessibilityRole="checkbox" accessibilityLabel={pending ? `${label}, sparar` : label} accessibilityState={{ checked, disabled, busy: pending }} aria-checked={checked} aria-busy={pending} disabled={disabled} onPress={() => { pressedIntent.current = !checked; requestFeedback(!checked); onPress(); }} style={({ pressed }) => [styles.row, variant === 'grouped' && styles.groupedRow, pressed && !disabled && styles.pressed, disabled && !pending && styles.disabled]}><Animated.View style={{ transform: [{ scale: checkScale }] }}><Ionicons name={checkIcon} size={checkSize} color={checked ? tokens.colors.success : tokens.colors.textSecondary} /></Animated.View>{leadingIcon ? <ThemedIcon name={leadingIcon} tone={leadingIconTone ?? 'neutral'} size="medium" testID={`checklist-item-icon-${leadingIcon}`} /> : null}<Text style={[styles.label, Platform.OS === 'web' ? webLongWordWrap : null]}>{label}</Text>{pending ? <Text style={styles.pendingLabel}>Sparar…</Text> : null}</MotionPressable>;
}
const webLongWordWrap = { overflowWrap: 'anywhere' } as unknown as TextStyle;
const styles = StyleSheet.create({ row: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, paddingVertical: tokens.spacing.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong, borderRadius: tokens.radius.md, paddingHorizontal: tokens.spacing.sm }, groupedRow: { flex: 1, minWidth: 0, borderWidth: 0, borderRadius: 0, paddingHorizontal: 0 }, label: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 }, pendingLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 0 }, pressed: { backgroundColor: tokens.colors.selectedSurface }, disabled: { opacity: 0.55 } });
