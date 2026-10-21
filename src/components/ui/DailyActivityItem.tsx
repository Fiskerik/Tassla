import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MotionPressable } from './Motion';
import { IconChip, type IconCategory } from './IconChip';
import { tokens } from '../../theme/tokens';
import { Button } from './Button';

export type DailyActivityItemProps = {
  label: string;
  category?: IconCategory;
  kind?: 'routine' | 'training';
  routineLabel?: string;
  detail?: string;
  completed: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  onLongPress?: () => void;
  onRemove?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  variant?: 'default' | 'home';
  pending?: boolean;
  statusMessage?: string;
  statusError?: boolean;
  onRetry?: () => void;
};

export function DailyActivityItem(props: DailyActivityItemProps) {
  if (props.variant === 'home') return <HomeDailyActivityItem {...props} />;
  const { label, category = 'training', detail, completed, onToggle, onOpen, onRemove, accessibilityLabel = label } = props;
  return <View style={styles.row}>
    <MotionPressable accessibilityRole="checkbox" aria-checked={completed} accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: completed, disabled: !onToggle }} disabled={!onToggle}
      onPress={() => onToggle?.()} style={({ pressed }) => [styles.checkbox, pressed && onToggle && styles.pressed]}>
      <Ionicons name={completed ? 'checkmark-circle' : 'ellipse-outline'} size={tokens.size.iconMd}
        color={completed ? tokens.colors.success : tokens.colors.textSecondary} accessibilityElementsHidden />
    </MotionPressable>
    <IconChip category={category} size="medium" />
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

function HomeDailyActivityItem({ label, kind = 'routine', routineLabel, completed, onToggle, onOpen, onLongPress, accessibilityHint, accessibilityLabel = label,
  pending = false, statusMessage = '', statusError = false, onRetry }: DailyActivityItemProps) {
  const status = pending ? 'Sparar…' : statusMessage;
  const rowLabel = accessibilityLabel + (kind === 'training' ? `, ${completed ? 'klar' : 'inte klar'}, öppna Träning` : '');
  const routineItemLabel = routineLabel ? `Rutin ${routineLabel}, punkt ${label}` : `Egen rutin: ${label}`;
  const routineCheckbox = <View accessibilityElementsHidden style={[styles.homeCheckbox, completed && styles.homeCheckboxChecked]}>
    {completed ? <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.onPrimary} /> : null}
  </View>;

  if (kind === 'training') return <View style={styles.homeRowWrap}>
    <MotionPressable accessibilityRole="button" accessibilityLabel={rowLabel} onPress={onOpen}
      style={({ pressed }) => [styles.homeTrainingRow, pressed && styles.pressed]}>
      <View accessibilityElementsHidden style={styles.homeTrainingStatusCell}>
        <View style={[styles.homeTrainingStatus, completed && styles.homeTrainingStatusChecked]}>
          {completed ? <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.onPrimary} /> : null}
        </View>
      </View>
      <View style={styles.homeCopy}>
        <Text style={[styles.homeLabel, completed && styles.completedTrainingLabel]}>{label}</Text>
        {status ? <Text accessibilityRole={statusError ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[styles.homeStatus, statusError && styles.homeError]}>{status}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden />
    </MotionPressable>
    {statusMessage && onRetry ? <Button variant="tertiary" label={`Kontrollera ändringen för ${label} igen`} accessibilityLabel={`Kontrollera ändringen för ${label} igen`} disabled={pending} onPress={onRetry} /> : null}
  </View>;

  return <View style={styles.homeRowWrap}>
    <View style={styles.homeRoutineRow}>
      <MotionPressable accessibilityRole="checkbox" aria-checked={completed} accessibilityLabel={`${routineItemLabel}, ${completed ? 'klar' : 'inte klar'}`}
        accessibilityState={{ checked: completed, disabled: !onToggle || pending }} disabled={!onToggle || pending}
        onPress={onToggle} style={({ pressed }) => [styles.homeToggleTarget, pressed && styles.pressed]}>
        {routineCheckbox}
      </MotionPressable>
      <MotionPressable accessibilityRole="button" accessibilityLabel={`Öppna ${routineItemLabel}`} accessibilityHint={accessibilityHint}
        onPress={onOpen} onLongPress={onLongPress}
        style={({ pressed }) => [styles.homeDetailTarget, pressed && styles.pressed]}>
        <View style={styles.homeCopy}>
          <Text style={styles.homeLabel}>{label}</Text>
          {status ? <Text accessibilityRole={statusError ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[styles.homeStatus, statusError && styles.homeError]}>{status}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden />
      </MotionPressable>
    </View>
    {statusMessage && onRetry ? <Button variant="tertiary" label="Kontrollera ändringen igen" accessibilityLabel={`Kontrollera ändringen för ${label} igen`} disabled={pending} onPress={onRetry} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  row: { minHeight: tokens.size.touchMin, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  checkbox: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full },
  copy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  label: { ...tokens.typography.caption, color: tokens.colors.textPrimary, fontWeight: '700', flexShrink: 1 },
  detail: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 },
  openButton: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.xs, borderRadius: tokens.radius.sm },
  openLabel: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  removeButton: { minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.xs, borderRadius: tokens.radius.sm },
  homeRowWrap: { alignSelf: 'stretch', borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  homeRoutineRow: { minHeight: tokens.size.touchMin, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center' },
  homeToggleTarget: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: tokens.spacing.sm },
  homeDetailTarget: { flex: 1, minWidth: 0, minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', paddingRight: tokens.spacing.xs },
  homeTrainingRow: { minHeight: tokens.size.touchMin, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', paddingRight: tokens.spacing.xs },
  homeCheckbox: { width: tokens.size.homeCheckbox, height: tokens.size.homeCheckbox, borderWidth: 2, borderColor: tokens.colors.home.textMuted, borderRadius: tokens.spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.card },
  homeCheckboxChecked: { borderColor: tokens.colors.home.greenStrong, backgroundColor: tokens.colors.home.greenStrong },
  homeTrainingStatusCell: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  homeTrainingStatus: { width: tokens.size.homeCheckbox - tokens.spacing.xs, height: tokens.size.homeCheckbox - tokens.spacing.xs, borderWidth: 2, borderColor: tokens.colors.home.textMuted, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.card },
  homeTrainingStatusChecked: { borderColor: tokens.colors.home.greenStrong, backgroundColor: tokens.colors.home.greenStrong },
  homeCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs / 2 },
  homeLabel: { ...tokens.typography.caption, color: tokens.colors.home.text, fontWeight: '500', flexShrink: 1 },
  completedTrainingLabel: { color: tokens.colors.home.textMuted },
  homeStatus: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 },
  homeError: { color: tokens.colors.danger },
  pressed: { backgroundColor: tokens.colors.selectedSurface },
});
