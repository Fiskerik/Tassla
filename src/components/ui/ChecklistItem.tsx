import { MotionPressable } from './Motion';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text } from 'react-native';
import { tokens } from '../../theme/tokens';
export function ChecklistItem({ label, checked, onPress, disabled = false }: { label: string; checked: boolean; onPress: () => void; disabled?: boolean }) {
  return <MotionPressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked, disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.row, pressed && !disabled && styles.pressed, disabled && styles.disabled]}><Ionicons name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={tokens.size.iconMd} color={checked ? tokens.colors.success : tokens.colors.textSecondary} /><Text style={styles.label}>{label}</Text></MotionPressable>;
}
const styles = StyleSheet.create({ row: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, paddingVertical: tokens.spacing.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong, borderRadius: tokens.radius.md, paddingHorizontal: tokens.spacing.sm }, label: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 }, pressed: { backgroundColor: tokens.colors.selectedSurface }, disabled: { opacity: 0.55 } });
