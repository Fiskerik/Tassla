import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { IconChip, type IconCategory } from './IconChip';

export function ListRow({ title, meta, detail, time, category, onPress, accessibilityLabel, disabled = false, complete = false, chevron = true }: { title: string; meta?: string; detail?: string; time?: string; category: IconCategory; onPress?: () => void; accessibilityLabel?: string; disabled?: boolean; complete?: boolean; chevron?: boolean }) {
  const secondary = detail ?? meta;
  const label = accessibilityLabel ?? [title, time, secondary, onPress ? 'tryck för att ändra' : undefined].filter(Boolean).join(', ');
  const content = <>
    {time ? <Text style={styles.time}>{time}</Text> : null}
    <IconChip category={category} />
    <View style={styles.copy}><Text style={styles.title}>{title}</Text>{secondary ? <Text style={styles.meta}>{secondary}</Text> : null}</View>
    {complete ? <Ionicons name="checkmark-circle" size={tokens.size.iconSm} color={tokens.colors.success} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
    {chevron ? <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
  </>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, selected: complete }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.row, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>{content}</Pressable>
    : <View accessibilityRole="summary" accessibilityLabel={label} style={styles.row}>{content}</View>;
}
const styles = StyleSheet.create({ row: { minHeight: tokens.size.buttonHeight, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.sm, borderRadius: tokens.radius.md }, time: { ...tokens.typography.caption, color: tokens.colors.textSecondary, minWidth: tokens.size.chipMd }, copy: { flex: 1, flexShrink: 1 }, title: { ...tokens.typography.label, color: tokens.colors.textPrimary, flexShrink: 1 }, meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 }, pressed: { backgroundColor: tokens.colors.selectedSurface }, disabled: { opacity: 0.55 } });
