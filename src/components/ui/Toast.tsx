import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { Button } from './Button';
export type ToastTone = 'success' | 'error' | 'neutral' | 'uncertain';
type ToastProps = { tone: Exclude<ToastTone, 'uncertain'>; message?: string; onUndo?: () => void; onRetry?: () => void; onCancel?: () => void; confirmed?: boolean } | { tone: 'uncertain'; message?: string; onRetry: () => void; onCancel?: () => void; confirmed?: boolean };
export function Toast(props: ToastProps) {
  const { tone, message, onRetry, onCancel, confirmed = false } = props;
  const onUndo = 'onUndo' in props ? props.onUndo : undefined;
  // Success is rendered only after the caller has confirmed a real persisted write.
  const effectiveTone = tone === 'success' && !confirmed ? 'uncertain' : tone;
  const effectiveMessage = effectiveTone === 'uncertain' ? 'Vi kunde inte kontrollera om det sparades' : message ?? (effectiveTone === 'error' ? 'Kunde inte spara' : 'Sparat');
  const action = effectiveTone === 'success' && onUndo ? { label: 'Ångra', onPress: onUndo, disabled: false } : (effectiveTone === 'error' || effectiveTone === 'uncertain') ? { label: 'Försök igen', onPress: onRetry ?? (() => undefined), disabled: !onRetry } : undefined;
  return <View accessibilityRole="alert" accessibilityLabel={effectiveMessage} style={[styles.toast, (effectiveTone === 'error' && onCancel) && styles.withCancel, effectiveTone === 'error' && styles.error, effectiveTone === 'success' && styles.success, effectiveTone === 'uncertain' && styles.uncertain]}><Text style={styles.message}>{effectiveMessage}</Text>{action ? <Button variant="tertiary" label={action.label} accessibilityLabel={action.label} onPress={action.onPress} disabled={action.disabled} /> : null}{effectiveTone === 'error' && onCancel ? <Button variant="secondary" label="Avbryt" accessibilityLabel="Avbryt" onPress={onCancel} /> : null}</View>;
}
const styles = StyleSheet.create({ toast: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, padding: tokens.spacing.md, gap: tokens.spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.selectedSurface }, withCancel: { flexDirection: 'column', alignItems: 'stretch' }, error: { backgroundColor: tokens.colors.dangerSurface, borderColor: tokens.colors.dangerBorder }, success: { backgroundColor: tokens.colors.successSurface, borderColor: tokens.colors.success }, uncertain: { backgroundColor: tokens.colors.warningSurface, borderColor: tokens.colors.warning }, message: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 } });
