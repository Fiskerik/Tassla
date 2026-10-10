import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { MotionPressable } from './Motion';

type Mode = 'Home' | 'Back' | 'Close' | 'Title';
export function AppBar({ mode, title, onAction, actionLabel }: { mode: Mode; title: string; onAction?: () => void; actionLabel?: string }) {
  const control = (icon: 'chevron-back' | 'close' | 'notifications-outline', label: string) => (
    <MotionPressable accessibilityRole="button" accessibilityLabel={label} onPress={onAction} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <Ionicons name={icon} size={tokens.size.iconMd} color={tokens.colors.textPrimary} />
    </MotionPressable>
  );

  if (mode === 'Home') return <View style={[styles.bar, styles.homeBar]}>
    <View style={styles.side} />
    <Text accessibilityRole="header" style={styles.homeBrand}>Tassla</Text>
    <View style={styles.side}>{onAction ? control('notifications-outline', actionLabel ?? 'Påminnelser') : null}</View>
  </View>;

  return <View style={[styles.bar, styles.titleBar]}>
    <Text style={styles.brand} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">Tassla</Text>
    <View style={styles.titleRow}>
      <View style={styles.side}>{mode === 'Back' ? control('chevron-back', 'Tillbaka') : null}</View>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <View style={styles.side}>{mode === 'Close' ? control('close', 'Stäng') : null}</View>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  bar: { marginBottom: tokens.spacing.md },
  homeBar: { minHeight: tokens.size.navHeight, flexDirection: 'row', alignItems: 'center' },
  titleBar: { gap: tokens.spacing.xs },
  brand: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textAlign: 'center' },
  homeBrand: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textAlign: 'center', flex: 1 },
  titleRow: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center' },
  side: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  action: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center' },
  title: { ...tokens.typography.label, color: tokens.colors.textPrimary, textAlign: 'center', flex: 1 },
  pressed: { backgroundColor: tokens.colors.selectedSurface },
});
