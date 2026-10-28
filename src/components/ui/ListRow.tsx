import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type AccessibilityState } from 'react-native';
import { MotionPressable, useReducedMotion } from './Motion';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { IconChip, type IconCategory, type IconChipVariant } from './IconChip';

export function ListRow({ title, meta, detail, time, category, accidentKinds, iconVariant, onPress, accessibilityLabel, accessibilityState, disabled = false, complete = false, animateCompleteKey, onCompleteAnimationStart, chevron = true, titleSize = 'standard', variant = 'default', showDivider = false }: { title: string; meta?: string; detail?: string; time?: string; category: IconCategory; accidentKinds?: readonly ('pee' | 'poop')[] | null; iconVariant?: IconChipVariant; onPress?: () => void; accessibilityLabel?: string; accessibilityState?: AccessibilityState; disabled?: boolean; complete?: boolean; animateCompleteKey?: string; onCompleteAnimationStart?: (key: string) => void; chevron?: boolean; titleSize?: 'standard' | 'compact'; variant?: 'default' | 'log-timeline'; showDivider?: boolean }) {
  const secondary = detail ?? meta;
  const baseLabel = accessibilityLabel ?? [title, time, secondary].filter(Boolean).join(', ');
  const label = complete ? `${baseLabel}, Genomförd` : baseLabel;
  const isLogTimeline = variant === 'log-timeline';
  const rowIconVariant = isLogTimeline ? 'rev02-log' : iconVariant;
  const titleText = titleSize === 'compact' ? <Text style={styles.titleCompact}>{title}</Text> : <Text style={styles.title}>{title}</Text>;
  const content = isLogTimeline ? <>
    <View style={styles.logTimeColumn}>{time ? <Text style={styles.logTime}>{time}</Text> : null}</View>
    <IconChip category={category} variant={rowIconVariant} accidentKinds={accidentKinds} />
    <View style={styles.copy}><View style={styles.headline}>{titleText}</View>{secondary ? <Text style={styles.meta}>{secondary}</Text> : null}</View>
    {complete ? <CompletionMark animateKey={animateCompleteKey} onAnimationStart={onCompleteAnimationStart} /> : null}
    {chevron && onPress ? <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
  </> : <>
    <IconChip category={category} variant={rowIconVariant} />
    <View style={styles.copy}><View style={styles.headline}>{time ? <Text style={styles.time}>{time}</Text> : null}{titleText}</View>{secondary ? <Text style={styles.meta}>{secondary}</Text> : null}</View>
    {complete ? <CompletionMark animateKey={animateCompleteKey} onAnimationStart={onCompleteAnimationStart} /> : null}
    {chevron && onPress ? <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
  </>;
  const row = onPress ? <MotionPressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, ...accessibilityState }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.row, isLogTimeline && styles.logTimelineRow, pressed && !disabled && (isLogTimeline ? styles.logTimelinePressed : styles.pressed), disabled && styles.disabled]}>{content}</MotionPressable>
    : <View accessibilityRole="summary" accessibilityLabel={label} accessibilityState={accessibilityState} style={[styles.row, isLogTimeline && styles.logTimelineRow]}>{content}</View>;
  return showDivider ? <View style={styles.dividedRow}>{row}<View pointerEvents="none" style={styles.divider} /></View> : row;
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
const styles = StyleSheet.create({ row: { minHeight: tokens.size.buttonHeight, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.md, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surface }, logTimelineRow: { minHeight: tokens.size.buttonHeight, paddingHorizontal: 0, paddingVertical: tokens.spacing.sm, gap: tokens.spacing.sm, borderRadius: 0, backgroundColor: tokens.colors.transparent }, logTimeColumn: { width: tokens.size.touchMin, flexShrink: 0, alignItems: 'flex-start' }, dividedRow: { alignSelf: 'stretch' }, divider: { height: tokens.size.stroke, backgroundColor: tokens.colors.border, marginLeft: tokens.size.touchMin + tokens.size.chipMd + tokens.spacing.sm + tokens.spacing.sm }, headline: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: tokens.spacing.sm }, time: { ...tokens.typography.caption, color: tokens.colors.textSecondary, minWidth: tokens.size.chipMd }, logTime: { ...tokens.typography.caption, color: tokens.colors.textSecondary, fontVariant: ['tabular-nums'] }, copy: { flex: 1, flexShrink: 1 }, title: { ...tokens.typography.label, color: tokens.colors.textPrimary, flexShrink: 1 }, titleCompact: { ...tokens.typography.caption, color: tokens.colors.textPrimary, fontWeight: '700' }, meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 }, pressed: { backgroundColor: tokens.colors.selectedSurface }, logTimelinePressed: { backgroundColor: tokens.colors.selectedSurface }, disabled: { opacity: 0.55 } });
