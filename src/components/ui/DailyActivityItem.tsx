import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MotionPressable } from './Motion';
import { IconChip, type IconCategory } from './IconChip';
import { tokens } from '../../theme/tokens';
import { Button } from './Button';
import type { DailyRoutineChecklistIcon } from '../../features/home/daily-routine-checklist-icons';

export type DailyActivityItemProps = {
  testID?: string;
  label: string;
  category?: IconCategory;
  kind?: 'routine' | 'training' | 'health';
  routineLabel?: string;
  detail?: string;
  description?: string;
  icon?: DailyRoutineChecklistIcon;
  presentation?: 'compact' | 'detail' | 'preview';
  statusLabel?: string;
  readOnly?: boolean;
  completed: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  onLongPress?: () => void;
  onRemove?: () => void;
  accessibilityLabel?: string;
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

function HomeDailyActivityItem({ label, kind = 'routine', routineLabel, completed, onToggle, onOpen, onLongPress, accessibilityLabel = label,
  testID, category, statusLabel, readOnly = false, presentation = 'compact', icon, description, detail,
  pending = false, statusMessage = '', statusError = false, onRetry }: DailyActivityItemProps) {
  const status = pending ? 'Sparar…' : statusMessage;
  const visibleStatus = status || statusLabel;
  const rowLabel = accessibilityLabel + (kind === 'training' ? `, ${completed ? 'klar' : 'inte klar'}${onOpen ? ', öppna Träning' : ''}` : '');
  const routineItemLabel = routineLabel ? `Rutin ${routineLabel}, punkt ${label}` : `Egen rutin: ${label}`;
  const routineCheckbox = <View accessibilityElementsHidden style={[styles.homeCheckbox, completed && styles.homeCheckboxChecked]}>
    {completed ? <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.onPrimary} /> : null}
  </View>;

  if (presentation === 'preview') return <View testID={testID} style={styles.homeRowWrap}>
    <View style={styles.homePlannedRow}>
      {kind === 'health' ? <IconChip category={category ?? 'vaccination'} size="medium" />
        : icon ? <View accessibilityElementsHidden style={styles.homeItemIcon}><Ionicons name={icon} size={tokens.size.iconMd} color={tokens.colors.primary} /></View>
          : <Ionicons name={kind === 'training' ? 'school-outline' : 'repeat-outline'} size={tokens.size.iconMd} color={tokens.colors.home.textMuted} accessibilityElementsHidden />}
      <View style={styles.homeCopy}>
        <Text style={styles.homeLabel}>{label}</Text>
        <Text style={styles.homeStatus}>{detail ? `${detail} · ${visibleStatus ?? 'Planerad'}` : visibleStatus ?? 'Planerad'}</Text>
      </View>
    </View>
  </View>;

  if (kind === 'health') return <HomePlannedHealthRow label={label} accessibilityLabel={accessibilityLabel}
    category={category ?? 'vaccination'} status={visibleStatus} onOpen={onOpen} />;

  if (kind === 'training') return <View style={styles.homeRowWrap}>
    <MotionPressable accessibilityRole="button" accessibilityLabel={rowLabel} onPress={onOpen}
      style={({ pressed }) => [styles.homeTrainingRow, pressed && styles.pressed]}>
      <View accessibilityElementsHidden style={styles.homeTrainingStatusCell}>
        <View style={[styles.homeTrainingStatus, completed && styles.homeTrainingStatusChecked]}>
          {completed ? <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.onPrimary} /> : null}
        </View>
      </View>
      <View style={styles.homeCopy}>
        <View style={styles.homeTrainingTitleRow}>
          <Ionicons name="school-outline" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden />
          <Text style={[styles.homeLabel, completed && styles.completedTrainingLabel]}>{label}</Text>
        </View>
        {presentation === 'detail' && detail ? <Text style={styles.homeDetail}>{detail}</Text> : null}
        {visibleStatus ? <Text accessibilityRole={statusError ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[styles.homeStatus, statusError && styles.homeError]}>{visibleStatus}</Text> : null}
      </View>
      {onOpen ? <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden /> : null}
    </MotionPressable>
    {statusMessage && onRetry ? <Button variant="tertiary" label={`Kontrollera ändringen för ${label} igen`} accessibilityLabel={`Kontrollera ändringen för ${label} igen`} disabled={pending} onPress={onRetry} /> : null}
  </View>;

  if (readOnly) {
    const content = <>
      {presentation === 'detail' && kind === 'routine' && icon
        ? <View accessibilityElementsHidden style={styles.homeItemIcon}><Ionicons name={icon} size={tokens.size.iconMd} color={tokens.colors.primary} /></View>
        : <Ionicons name={statusLabel === 'Överhoppad' ? 'remove-circle-outline' : 'repeat-outline'} size={tokens.size.iconMd}
          color={tokens.colors.home.textMuted} accessibilityElementsHidden />}
      <View style={styles.homeCopy}>
        <Text style={styles.homeLabel}>{label}</Text>
        {presentation === 'detail' && description ? <Text style={styles.homeDetail}>{description}</Text> : null}
        {visibleStatus ? <Text style={styles.homeStatus}>{visibleStatus}</Text> : null}
      </View>
      {onOpen ? <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden /> : null}
    </>;
    return <View style={styles.homeRowWrap}>{onOpen
      ? <MotionPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onOpen}
        style={({ pressed }) => [styles.homePlannedRow, pressed && styles.pressed]}>{content}</MotionPressable>
      : <View style={styles.homePlannedRow}>{content}</View>}</View>;
  }

  return <View style={styles.homeRowWrap}>
    <View style={styles.homeRoutineRow}>
      <MotionPressable accessibilityRole="checkbox" aria-checked={completed} accessibilityLabel={`${routineItemLabel}, ${completed ? 'klar' : 'inte klar'}`}
        accessibilityState={{ checked: completed, disabled: !onToggle || pending }} disabled={!onToggle || pending}
        onPress={onToggle} style={({ pressed }) => [styles.homeToggleTarget, pressed && styles.pressed]}>
        {routineCheckbox}
      </MotionPressable>
      <MotionPressable accessibilityRole="button" accessibilityLabel={`Öppna ${routineItemLabel}`} onPress={onOpen} onLongPress={onLongPress}
        style={({ pressed }) => [styles.homeDetailTarget, pressed && styles.pressed]}>
        {presentation === 'detail' && icon ? <View accessibilityElementsHidden style={styles.homeItemIcon}>
          <Ionicons name={icon} size={tokens.size.iconMd} color={tokens.colors.primary} />
        </View> : null}
        <View style={styles.homeCopy}>
          <Text style={styles.homeLabel}>{label}</Text>
          {presentation === 'detail' && description ? <Text style={styles.homeDetail}>{description}</Text> : null}
          {visibleStatus ? <Text accessibilityRole={statusError ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[styles.homeStatus, statusError && styles.homeError]}>{visibleStatus}</Text> : null}
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
  homePlannedRow: { minHeight: tokens.size.touchMin, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.sm },
  homeToggleTarget: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: tokens.spacing.sm },
  homeDetailTarget: { flex: 1, minWidth: 0, minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingRight: tokens.spacing.xs },
  homeItemIcon: { width: 32, height: 32, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.selectedSurface },
  homeTrainingRow: { minHeight: tokens.size.touchMin, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', paddingRight: tokens.spacing.xs },
  homeTrainingTitleRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  homeCheckbox: { width: tokens.size.homeCheckbox, height: tokens.size.homeCheckbox, borderWidth: 2, borderColor: tokens.colors.home.textMuted, borderRadius: tokens.spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.card },
  homeCheckboxChecked: { borderColor: tokens.colors.home.greenStrong, backgroundColor: tokens.colors.home.greenStrong },
  homeTrainingStatusCell: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  homeTrainingStatus: { width: tokens.size.homeCheckbox, height: tokens.size.homeCheckbox, borderWidth: 2, borderColor: tokens.colors.home.textMuted, borderRadius: tokens.spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.card },
  homeTrainingStatusChecked: { borderColor: tokens.colors.home.greenStrong, backgroundColor: tokens.colors.home.greenStrong },
  homeCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs / 2 },
  homeLabel: { ...tokens.typography.caption, color: tokens.colors.home.text, fontWeight: '500', flexShrink: 1 },
  completedTrainingLabel: { color: tokens.colors.home.textMuted },
  homeStatus: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 },
  homeDetail: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 },
  homeError: { color: tokens.colors.danger },
  pressed: { backgroundColor: tokens.colors.selectedSurface },
});

function HomePlannedHealthRow({ label, accessibilityLabel, category, status, onOpen }: {
  label: string; accessibilityLabel: string; category: IconCategory; status?: string; onOpen?: () => void;
}) {
  return <View style={styles.homeRowWrap}>
    <MotionPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onOpen}
      style={({ pressed }) => [styles.homePlannedRow, pressed && styles.pressed]}>
      <IconChip category={category} size="medium" />
      <View style={styles.homeCopy}>
        <Text style={styles.homeLabel}>{label}</Text>
        {status ? <Text style={styles.homeStatus}>{status}</Text> : null}
      </View>
      {onOpen ? <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden /> : null}
    </MotionPressable>
  </View>;
}
