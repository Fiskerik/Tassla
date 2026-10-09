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
  if (mode === 'Home') return <View style={styles.bar}>
    <Text accessibilityRole="header" style={styles.brand}>Tassla</Text>
    {onAction ? control('notifications-outline', actionLabel ?? 'Påminnelser') : null}
  </View>;
  return <View style={styles.bar}>
    <View style={styles.side}>{mode === 'Back' ? control('chevron-back', 'Tillbaka') : null}</View>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <View style={styles.side}>{mode === 'Close' ? control('close', 'Stäng') : null}</View>
  </View>;
}
const styles = StyleSheet.create({
  bar: { minHeight: tokens.size.navHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.md },
  side: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin },
  action: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center' },
  brand: { ...tokens.typography.title, color: tokens.colors.textPrimary },
  title: { ...tokens.typography.label, color: tokens.colors.textPrimary, textAlign: 'center', flex: 1 },
  pressed: { backgroundColor: tokens.colors.selectedSurface },
});
