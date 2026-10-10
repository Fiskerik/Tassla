import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type AccessibilityState } from 'react-native';
import { MotionPressable, useReducedMotion } from './Motion';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { IconChip, type IconCategory } from './IconChip';

export function ListRow({ title, meta, detail, time, category, onPress, accessibilityLabel, accessibilityState, disabled = false, complete = false, animateCompleteKey, onCompleteAnimationStart, chevron = true, titleSize = 'standard' }: { title: string; meta?: string; detail?: string; time?: string; category: IconCategory; onPress?: () => void; accessibilityLabel?: string; accessibilityState?: AccessibilityState; disabled?: boolean; complete?: boolean; animateCompleteKey?: string; onCompleteAnimationStart?: (key: string) => void; chevron?: boolean; titleSize?: 'standard' | 'compact' }) {
  const secondary = detail ?? meta;
  const baseLabel = accessibilityLabel ?? [title, time, secondary].filter(Boolean).join(', ');
  const label = complete ? `${baseLabel}, Genomförd` : baseLabel;
  const content = <>
    <IconChip category={category} />
    <View style={styles.copy}><View style={styles.headline}>{titleSize === 'compact' ? <>{time ? <Text style={styles.time}>{time}</Text> : null}<Text style={styles.titleCompact}>{title}</Text></> : <>{time ? <Text style={styles.time}>{time}</Text> : null}<Text style={styles.title}>{title}</Text></>}</View>{secondary ? <Text style={styles.meta}>{secondary}</Text> : null}</View>
    {complete ? <CompletionMark animateKey={animateCompleteKey} onAnimationStart={onCompleteAnimationStart} /> : null}
    {chevron && onPress ? <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
  </>;
  return onPress ? <MotionPressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, ...accessibilityState }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.row, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>{content}</MotionPressable>
    : <View accessibilityRole="summary" accessibilityLabel={label} accessibilityState={accessibilityState} style={styles.row}>{content}</View>;
}

function CompletionMark({ animateKey, onAnimationStart }: { animateKey?: string; onAnimationStart?: (key: string) => void }) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(1));
  const playedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!animateKey) return;
    if (playedKey.current === animateKey) {
      if (reduced) { progress.stopAnimation(); progress.setValue(1); }
      return;
    }
    playedKey.current = animateKey;
    onAnimationStart?.(animateKey);
    progress.stopAnimation();
    if (reduced) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: tokens.motion.check, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
  }, [animateKey, onAnimationStart, progress, reduced]);
  useEffect(() => {
    if (!reduced) return;
    progress.stopAnimation();
    progress.setValue(1);
  }, [progress, reduced]);
  useEffect(() => () => progress.stopAnimation(), [progress]);
  return <Animated.View style={{ opacity: progress, transform: [{ scale: progress }] }}><Ionicons name="checkmark-circle" size={tokens.size.iconSm} color={tokens.colors.success} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /></Animated.View>;
}
const styles = StyleSheet.create({ row: { minHeight: tokens.size.buttonHeight, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.md, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surface }, headline: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: tokens.spacing.sm }, time: { ...tokens.typography.caption, color: tokens.colors.textSecondary, minWidth: tokens.size.chipMd }, copy: { flex: 1, flexShrink: 1 }, title: { ...tokens.typography.label, color: tokens.colors.textPrimary, flexShrink: 1 }, titleCompact: { ...tokens.typography.caption, color: tokens.colors.textPrimary, fontWeight: '700' }, meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 }, pressed: { backgroundColor: tokens.colors.selectedSurface }, disabled: { opacity: 0.55 } });
