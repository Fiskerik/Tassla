import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { IconChip, type IconCategory } from './IconChip';

export function ListRow({ title, meta, category, onPress, disabled = false, complete = false }: { title: string; meta?: string; category: IconCategory; onPress: () => void; disabled?: boolean; complete?: boolean }) {
  const label = meta ? `${title}. ${meta}` : title;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, selected: complete }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.row, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>
    <IconChip category={category} />
    <View style={styles.copy}><Text style={styles.title}>{title}</Text>{meta ? <Text style={styles.meta}>{meta}</Text> : null}</View>
    <Ionicons name={complete ? 'checkmark-circle' : 'chevron-forward'} size={tokens.size.iconSm} color={complete ? tokens.colors.success : tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
  </Pressable>;
}
const styles = StyleSheet.create({ row: { minHeight: tokens.size.buttonHeight, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.sm, borderRadius: tokens.radius.md }, copy: { flex: 1 }, title: { ...tokens.typography.label, color: tokens.colors.textPrimary, flexShrink: 1 }, meta: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 }, pressed: { backgroundColor: tokens.colors.selectedSurface }, disabled: { opacity: 0.55 } });
