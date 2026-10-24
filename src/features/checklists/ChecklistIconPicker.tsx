import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { MotionPressable } from '../../components/ui/Motion';
import { ThemedIcon } from '../../components/ui/ThemedIcon';
import { tokens } from '../../theme/tokens';
import { CHECKLIST_ICONS, CHECKLIST_ICON_LABELS, checklistIconTone, type ChecklistDisplayIcon, type ChecklistIcon } from './checklist-icons';

type ChecklistIconPickerProps = {
  value: ChecklistIcon | null;
  label: string;
  expanded: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onSelect: (icon: ChecklistIcon) => void;
  testIDPrefix?: string;
  itemKey?: string;
  popover?: boolean;
};
type ChecklistIconPickerTriggerProps = Pick<ChecklistIconPickerProps, 'value' | 'label' | 'expanded' | 'disabled' | 'onToggle' | 'testIDPrefix' | 'itemKey'>;
type ChecklistIconPickerChoicesProps = Pick<ChecklistIconPickerProps, 'value' | 'label' | 'expanded' | 'disabled' | 'onSelect' | 'testIDPrefix' | 'popover'>;

export function ChecklistIconPicker(props: ChecklistIconPickerProps) {
  return <View style={[styles.root, props.popover && styles.popoverRoot]}>
    <ChecklistIconPickerTrigger {...props} />
    {props.expanded ? <ChecklistIconPickerChoices {...props} /> : null}
  </View>;
}

export function ChecklistIconPickerTrigger({ value, label, expanded, disabled = false, onToggle, testIDPrefix = 'checklist', itemKey = 'item' }: ChecklistIconPickerTriggerProps) {
  const displayIcon: ChecklistDisplayIcon = value ?? 'list-outline';
  const displayLabel = value ? CHECKLIST_ICON_LABELS[value] : 'Allmän lista';
  return <MotionPressable accessibilityRole="button" accessibilityLabel={`Välj ikon för ${label}. Aktuell ikon: ${displayLabel}`}
    accessibilityState={{ expanded, disabled }} aria-expanded={expanded} disabled={disabled} onPress={onToggle}
    testID={`${testIDPrefix}-icon-picker-trigger-${itemKey}`}
    style={({ pressed }) => [styles.trigger, expanded && styles.selected, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
    <ThemedIcon name={displayIcon} tone={checklistIconTone(displayIcon)} size="small" surface={false} />
    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={tokens.spacing.sm} color={tokens.colors.textSecondary} />
  </MotionPressable>;
}

export function ChecklistIconPickerChoices({ label, value, expanded, disabled = false, onSelect, testIDPrefix = 'checklist', popover = false }: ChecklistIconPickerChoicesProps) {
  if (!expanded) return null;
  return <View accessibilityRole="radiogroup" accessibilityLabel={`Välj ikon för ${label}`} style={[styles.grid, popover && styles.popoverGrid]}>
      {CHECKLIST_ICONS.map((icon) => {
        const selected = value === icon;
        return <MotionPressable key={icon} accessibilityRole="radio" accessibilityLabel={CHECKLIST_ICON_LABELS[icon]}
          accessibilityState={{ selected, disabled }} aria-checked={selected} disabled={disabled} onPress={() => onSelect(icon)}
          testID={`${testIDPrefix}-icon-choice-icon-${icon}`}
          style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
          <View style={styles.choiceContents} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <ThemedIcon name={icon} tone={checklistIconTone(icon)} size="small" surface={false} />
            {selected ? <Ionicons name="checkmark-circle" size={tokens.spacing.md} color={tokens.colors.primary} style={styles.checkmark} /> : null}
          </View>
        </MotionPressable>;
      })}
  </View>;
}

const styles = StyleSheet.create({
  root: { gap: tokens.spacing.xs },
  popoverRoot: { zIndex: 5 },
  trigger: { minWidth: tokens.size.touchMin, width: tokens.size.touchMin, minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs / 2, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.surface },
  selected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.surface },
  popoverGrid: { position: 'absolute', zIndex: 5, elevation: 6, top: tokens.size.touchMin + tokens.spacing.xs, right: 0, width: tokens.size.touchMin * 4 + tokens.spacing.xs * 3 + tokens.spacing.sm * 2 + tokens.size.stroke * 2, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, shadowColor: tokens.colors.textPrimary, shadowOpacity: 0.14, shadowRadius: tokens.spacing.sm, shadowOffset: { width: 0, height: 3 } },
  choice: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.surface },
  choiceSelected: { borderWidth: 2, borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface },
  choiceContents: { width: '100%', minHeight: tokens.size.touchMin - tokens.size.stroke * 2, alignItems: 'center', justifyContent: 'center' },
  checkmark: { position: 'absolute', top: 1, right: 1, backgroundColor: tokens.colors.selectedSurface },
  disabled: { opacity: 0.5 },
  pressed: { backgroundColor: tokens.colors.selectedSurface },
});
