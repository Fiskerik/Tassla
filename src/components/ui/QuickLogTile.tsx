import { MotionPressable } from './Motion';
import type { ReactNode } from 'react';
import { StyleSheet, Text, type GestureResponderEvent } from 'react-native';
import { tokens } from '../../theme/tokens';
import { IconChip, type IconCategory } from './IconChip';
export function QuickLogTile({ label, category, icon, onPress, accessibilityLabel = label, disabled = false, subtle = false }: { label: string; category?: IconCategory; icon?: ReactNode; onPress: (event: GestureResponderEvent) => void; accessibilityLabel?: string; disabled?: boolean; subtle?: boolean }) {
  return <MotionPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.tile, subtle && styles.subtle, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>{icon ?? (category ? <IconChip category={category} size="large" /> : null)}<Text style={styles.label}>{label}</Text></MotionPressable>;
}
const styles = StyleSheet.create({ tile: { alignSelf: 'stretch', minHeight: tokens.size.quickLogHeight, flex: 1, padding: tokens.spacing.md, gap: tokens.spacing.sm, alignItems: 'center', justifyContent: 'center', borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surface }, subtle: { minHeight: tokens.size.touchMin, flexDirection: 'row', backgroundColor: tokens.colors.transparent, paddingVertical: tokens.spacing.xs }, label: { ...tokens.typography.label, color: tokens.colors.textPrimary, textAlign: 'center', flexShrink: 1 }, pressed: { backgroundColor: tokens.colors.selectedSurface }, disabled: { opacity: 0.55 } });
