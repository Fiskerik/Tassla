import { MotionPressable } from './Motion';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export function Card({ children, onPress, accessibilityLabel = 'Innehåll', selected = false }: { children: ReactNode; onPress?: () => void; accessibilityLabel?: string; selected?: boolean }) {
  if (onPress) return <MotionPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}>{children}</MotionPressable>;
  return <View accessibilityRole="summary" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }} style={[styles.card, selected && styles.selected]}>{children}</View>;
}
const styles = StyleSheet.create({ card: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, padding: tokens.layout.cardPadding, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface }, selected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface }, pressed: { opacity: 0.82 } });
