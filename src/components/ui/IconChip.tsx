import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { categoryColors, tokens } from '../../theme/tokens';
import { PoopIcon } from './PoopIcon';

export type IconCategory = keyof typeof categoryColors;
export type IconChipSize = 'medium' | 'large';
export const categoryIcons: Record<IconCategory, React.ComponentProps<typeof Ionicons>['name'] | 'poop'> = {
  pee: 'water-outline', poop: 'poop', food: 'restaurant-outline', sleep: 'moon-outline', awake: 'eye-outline',
  walk: 'footsteps-outline', training: 'school-outline', vaccination: 'bandage-outline', deworming: 'medical-outline', veterinary: 'medkit-outline',
};
const categoryLabels: Record<IconCategory, string> = {
  pee: 'Kiss', poop: 'Bajs', food: 'Mat', sleep: 'Sömn', awake: 'Vaken', walk: 'Promenad', training: 'Träning',
  vaccination: 'Vaccination', deworming: 'Avmaskning', veterinary: 'Veterinär',
};

export function IconChip({ category, size = 'medium' }: { category: IconCategory; size?: IconChipSize }) {
  const dimension = size === 'large' ? tokens.size.chipLg : tokens.size.chipMd;
  const iconSize = size === 'large' ? tokens.size.iconMd : tokens.size.iconSm;
  const color = categoryColors[category];
  const icon = categoryIcons[category];
  return (
    <View accessibilityRole="image" accessibilityLabel={`${categoryLabels[category]}-ikon`} style={[styles.chip, { width: dimension, minHeight: dimension, backgroundColor: color.bg, borderRadius: tokens.radius.full }]}>
      {icon === 'poop' ? <PoopIcon color={color.fg} size={iconSize} /> : <Ionicons name={icon} size={iconSize} color={color.fg} />}
    </View>
  );
}

const styles = StyleSheet.create({ chip: { minWidth: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center' } });
