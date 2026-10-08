import { Pressable, StyleSheet, Text } from 'react-native';
import { tokens } from '../../theme/tokens';
import { IconChip, type IconCategory } from './IconChip';
export function QuickLogTile({ label, category, onPress, disabled = false }: { label: string; category: IconCategory; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.tile, pressed && !disabled && styles.pressed, disabled && styles.disabled]}><IconChip category={category} size="large" /><Text style={styles.label}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({ tile: { alignSelf: 'stretch', minHeight: tokens.size.buttonHeight, flex: 1, padding: tokens.spacing.md, gap: tokens.spacing.sm, alignItems: 'center', justifyContent: 'center', borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface }, label: { ...tokens.typography.label, color: tokens.colors.textPrimary, textAlign: 'center', flexShrink: 1 }, pressed: { backgroundColor: tokens.colors.selectedSurface }, disabled: { opacity: 0.55 } });
