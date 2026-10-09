import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export type CardState = 'default' | 'pressed' | 'loading' | 'disabled' | 'success' | 'error';
export function Card({ children, onPress, accessibilityLabel = 'Innehåll', selected = false, state = 'default' }: { children: ReactNode; onPress?: () => void; accessibilityLabel?: string; selected?: boolean; state?: CardState }) {
  const unavailable = state === 'loading' || state === 'disabled';
  const content = <>{children}{state === 'loading' ? <ActivityIndicator color={tokens.colors.primary} /> : null}</>;
  const stateStyles = [styles.card, selected && styles.selected, state === 'pressed' && styles.pressed, state === 'success' && styles.success, state === 'error' && styles.error, unavailable && styles.disabled];
  if (onPress) return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected, disabled: unavailable, busy: state === 'loading' }} disabled={unavailable} onPress={onPress} style={({ pressed }) => [...stateStyles, pressed && !unavailable && styles.pressed]}>{content}</Pressable>;
  return <View accessibilityRole="summary" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected, busy: state === 'loading' }} style={stateStyles}>{content}</View>;
}
const styles = StyleSheet.create({ card: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, padding: tokens.layout.cardPadding, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface }, selected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface }, pressed: { opacity: tokens.opacity.pressed }, success: { borderColor: tokens.colors.success, backgroundColor: tokens.colors.successSurface }, error: { borderColor: tokens.colors.danger, backgroundColor: tokens.colors.dangerSurface }, disabled: { opacity: tokens.opacity.disabled } });
