import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MotionPressable } from './Motion';
import { tokens } from '../../theme/tokens';

export type HomeDestination = 'log' | 'training' | 'knowledge';

const destinationInfo: Record<HomeDestination, { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; foreground: string; background: string }> = {
  log: { label: 'Logga', icon: 'paw-outline', foreground: tokens.colors.category.pee.fg, background: tokens.colors.category.pee.bg },
  training: { label: 'Träna', icon: 'school-outline', foreground: tokens.colors.category.training.fg, background: tokens.colors.category.training.bg },
  knowledge: { label: 'Kunskap', icon: 'book-outline', foreground: tokens.colors.category.awake.fg, background: tokens.colors.category.awake.bg },
};

export function DestinationTile({ destination, onPress, compact = false, variant = 'default' }: { destination: HomeDestination; onPress: () => void; compact?: boolean; variant?: 'default' | 'home' }) {
  const item = destinationInfo[destination];
  const homeItem = tokens.colors.destination[destination];
  return <MotionPressable accessibilityRole="button" accessibilityLabel={`Öppna ${item.label}`} onPress={onPress}
    style={({ pressed }) => [styles.tile, compact && styles.compactTile, variant === 'home' && styles.homeTile,
      { backgroundColor: variant === 'home' ? homeItem.surface : item.background }, pressed && styles.pressed]}>
    <View style={[styles.icon, compact && styles.compactIcon, variant === 'home' && styles.homeIcon,
      variant === 'home' ? styles.homeIconSurface : { backgroundColor: item.background }]}>
      <Ionicons name={item.icon} size={variant === 'home' ? tokens.size.chipLg : tokens.size.iconMd}
        color={variant === 'home' ? homeItem.icon : item.foreground} accessibilityElementsHidden />
    </View>
    <Text style={styles.label}>{item.label}</Text>
  </MotionPressable>;
}

const styles = StyleSheet.create({
  tile: { minHeight: tokens.size.quickLogCompactHeight, flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs, padding: tokens.spacing.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.md },
  compactTile: { minHeight: tokens.size.touchMin + tokens.spacing.md, paddingVertical: tokens.spacing.xs },
  homeTile: { minHeight: tokens.size.homeDestinationTile, paddingVertical: tokens.spacing.sm, borderWidth: 0, borderRadius: tokens.radius.md, gap: tokens.spacing.xs },
  icon: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full },
  compactIcon: { width: tokens.size.touchMin - tokens.spacing.xs, minHeight: tokens.size.touchMin - tokens.spacing.xs },
  homeIcon: { width: tokens.size.chipLg, minHeight: tokens.size.chipLg, backgroundColor: 'transparent' },
  homeIconSurface: { backgroundColor: 'transparent' },
  label: { ...tokens.typography.caption, color: tokens.colors.textPrimary, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  pressed: { opacity: 0.82 },
});
