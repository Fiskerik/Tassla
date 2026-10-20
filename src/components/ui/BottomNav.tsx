import { MotionPressable } from './Motion';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export type BottomNavDestination = 'home' | 'log' | 'training' | 'knowledge' | 'more';
type Item = { key: BottomNavDestination; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; activeIcon: React.ComponentProps<typeof Ionicons>['name']; largeTextFlex: number };
const items: Item[] = [
  { key: 'home', label: 'Hem', icon: 'home-outline', activeIcon: 'home', largeTextFlex: 0.8667 },
  { key: 'log', label: 'Logg', icon: 'create-outline', activeIcon: 'create', largeTextFlex: 0.8667 },
  { key: 'training', label: 'Träning', icon: 'school-outline', activeIcon: 'school', largeTextFlex: 1.2 },
  { key: 'knowledge', label: 'Kunskap', icon: 'book-outline', activeIcon: 'book', largeTextFlex: 1.2 },
  { key: 'more', label: 'Mer', icon: 'grid-outline', activeIcon: 'grid', largeTextFlex: 0.8667 },
];

export function BottomNav({ active = 'home', onChange }: { active?: BottomNavDestination; onChange: (destination: BottomNavDestination) => void }) {
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= 1.3;
  return <View accessibilityRole="tablist" accessibilityLabel="Huvudmeny" style={styles.nav}>
    {items.map((item) => {
      const selected = item.key === active;
      return <MotionPressable key={item.key} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected }} aria-selected={selected} onPress={() => onChange(item.key)} style={({ pressed }) => [styles.item, largeText && { flex: item.largeTextFlex }, pressed && styles.pressed]}>
        <Ionicons name={selected ? item.activeIcon : item.icon} size={tokens.size.iconMd} color={selected ? tokens.colors.primary : tokens.colors.textSecondary} />
        <Text style={[styles.label, selected && styles.selectedLabel]}>{item.label}</Text>
      </MotionPressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  nav: { alignSelf: 'stretch', minHeight: tokens.size.navHeight, flexDirection: 'row', backgroundColor: tokens.colors.surface, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  item: { flex: 1, minWidth: tokens.size.touchMin, minHeight: tokens.size.navHeight, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs },
  label: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textAlign: 'center', width: '100%', flexShrink: 1 },
  selectedLabel: { color: tokens.colors.primary, fontWeight: '700' },
  pressed: { backgroundColor: tokens.colors.selectedSurface },
});
