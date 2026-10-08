import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type GestureResponderEvent } from 'react-native';
import { tokens } from '../../theme/tokens';
import { IconChip, type IconCategory } from './IconChip';
export function QuickLogTile({ label, category, icon, onPress, accessibilityLabel = label, disabled = false }: { label: string; category?: IconCategory; icon?: ReactNode; onPress: (event: GestureResponderEvent) => void; accessibilityLabel?: string; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.tile, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>{icon ?? (category ? <IconChip category={category} size="large" /> : null)}<Text style={styles.label}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({ tile: { alignSelf: 'stretch', minHeight: tokens.size.buttonHeight, flex: 1, padding: tokens.spacing.md, gap: tokens.spacing.sm, alignItems: 'center', justifyContent: 'center', borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface }, label: { ...tokens.typography.label, color: tokens.colors.textPrimary, textAlign: 'center', flexShrink: 1 }, pressed: { backgroundColor: tokens.colors.selectedSurface }, disabled: { opacity: 0.55 } });
