import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { IconChip, type IconCategory } from './IconChip';

export function ListRow({ title, meta, detail, time, category, onPress, disabled = false, complete = false, chevron = true }: { title: string; meta?: string; detail?: string; time?: string; category: IconCategory; onPress: () => void; disabled?: boolean; complete?: boolean; chevron?: boolean }) {
  const secondary = [time, detail ?? meta].filter(Boolean).join(' · ');
  const label = secondary ? `${title}. ${secondary}` : title;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, selected: complete }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.row, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>
    <IconChip category={category} />
    <View style={styles.copy}><Text style={styles.title}>{title}</Text>{secondary ? <Text style={styles.meta}>{secondary}</Text> : null}</View>
    {complete ? <Ionicons name="checkmark-circle" size={tokens.size.iconSm} color={tokens.colors.success} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
    {chevron ? <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
  </Pressable>;
}
const styles = StyleSheet.create({ row: { minHeight: tokens.size.buttonHeight, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.sm, borderRadius: tokens.radius.md }, copy: { flex: 1 }, title: { ...tokens.typography.label, color: tokens.colors.textPrimary, flexShrink: 1 }, meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 }, pressed: { backgroundColor: tokens.colors.selectedSurface }, disabled: { opacity: 0.55 } });
