import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MotionPressable } from './Motion';
import { IconChip, type IconCategory } from './IconChip';
import { tokens } from '../../theme/tokens';

export type DailyActivityItemProps = {
  label: string;
  category?: IconCategory;
  kind?: 'routine' | 'training';
  detail?: string;
  completed: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  onRemove?: () => void;
  accessibilityLabel?: string;
};

export function DailyActivityItem({ label, category = 'training', kind, detail, completed, onToggle, onOpen, onRemove, accessibilityLabel = label }: DailyActivityItemProps) {
  return <View style={styles.row}>
    <MotionPressable accessibilityRole="checkbox" accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: completed, disabled: !onToggle }} disabled={!onToggle}
      onPress={() => onToggle?.()} style={({ pressed }) => [styles.checkbox, pressed && onToggle && styles.pressed]}>
      <Ionicons name={completed ? 'checkmark-circle' : 'ellipse-outline'} size={tokens.size.iconMd}
        color={completed ? tokens.colors.success : tokens.colors.textSecondary} accessibilityElementsHidden />
    </MotionPressable>
    {kind === 'routine' ? <View accessibilityRole="image" accessibilityLabel="Rutin-ikon" style={styles.routineIcon}>
      <Ionicons name="list-outline" size={tokens.size.iconSm} color={tokens.colors.category.training.fg} accessibilityElementsHidden />
    </View> : <IconChip category={category} size="medium" />}
    <View style={styles.copy}>
      <Text style={styles.label}>{label}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
    {onOpen ? <MotionPressable accessibilityRole="button" accessibilityLabel={`Visa detaljer: ${label}`}
      onPress={onOpen} style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}>
      <Text style={styles.openLabel}>Visa</Text>
      <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden />
    </MotionPressable> : null}
    {onRemove ? <MotionPressable accessibilityRole="button" accessibilityLabel={`Ta bort från idag: ${label}`}
      onPress={onRemove} style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
      <Text style={styles.openLabel}>Ta bort</Text>
    </MotionPressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  row: { minHeight: tokens.size.touchMin, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  checkbox: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full },
  routineIcon: { width: tokens.size.chipMd, minHeight: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.category.training.bg, borderRadius: tokens.radius.full },
  copy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  label: { ...tokens.typography.caption, color: tokens.colors.textPrimary, fontWeight: '700', flexShrink: 1 },
  detail: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 },
  openButton: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.xs, borderRadius: tokens.radius.sm },
  openLabel: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  removeButton: { minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.xs, borderRadius: tokens.radius.sm },
  pressed: { backgroundColor: tokens.colors.selectedSurface },
});
