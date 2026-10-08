import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { Button } from './Button';
type Tone = 'success' | 'error' | 'neutral';
export function Toast({ tone, message, onUndo, onRetry }: { tone: Tone; message: string; onUndo?: () => void; onRetry?: () => void }) {
  const action = tone === 'success' && onUndo ? { label: 'Ångra', onPress: onUndo } : tone === 'error' && onRetry ? { label: 'Försök igen', onPress: onRetry } : undefined;
  return <View accessibilityRole="alert" accessibilityLabel={message} style={[styles.toast, tone === 'error' && styles.error, tone === 'success' && styles.success]}><Text style={styles.message}>{message}</Text>{action ? <Button variant="tertiary" label={action.label} accessibilityLabel={action.label} onPress={action.onPress} /> : null}</View>;
}
const styles = StyleSheet.create({ toast: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, padding: tokens.spacing.md, gap: tokens.spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: tokens.radius.md, backgroundColor: tokens.colors.selectedSurface }, error: { backgroundColor: tokens.colors.dangerSurface }, success: { backgroundColor: tokens.colors.successSurface }, message: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 } });
