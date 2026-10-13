import { MotionPressable } from './Motion';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export function Card({ children, onPress, accessibilityLabel = 'Innehåll', selected = false, variant = 'default' }: { children: ReactNode; onPress?: () => void; accessibilityLabel?: string; selected?: boolean; variant?: 'default' | 'home' }) {
  const cardStyle = variant === 'home' ? styles.homeCard : styles.card;
  if (onPress) return <MotionPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [cardStyle, selected && styles.selected, pressed && styles.pressed]}>{children}</MotionPressable>;
  return <View accessibilityRole="summary" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }} style={[cardStyle, selected && styles.selected]}>{children}</View>;
}
const styles = StyleSheet.create({ card: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, padding: tokens.layout.cardPadding, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface }, homeCard: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, padding: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.home.card }, selected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface }, pressed: { opacity: 0.82 } });
