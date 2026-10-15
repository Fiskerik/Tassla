import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { categoryColors, tokens } from '../../theme/tokens';
import { PoopIcon } from './PoopIcon';
import { PillIcon } from './PillIcon';

export type IconCategory = keyof typeof categoryColors;
export type IconChipSize = 'medium' | 'large';
export type IconChipVariant = 'default' | 'rev02-log';
export const categoryIcons: Record<IconCategory, React.ComponentProps<typeof Ionicons>['name'] | 'poop'> = {
  pee: 'water-outline', poop: 'poop', food: 'restaurant-outline', sleep: 'moon-outline', awake: 'eye-outline',
  walk: 'footsteps-outline', accident: 'water-outline', water: 'water-outline', training: 'school-outline', vaccination: 'bandage-outline', deworming: 'medical-outline', veterinary: 'medkit-outline',
};
const categoryLabels: Record<IconCategory, string> = {
  pee: 'Kiss', poop: 'Bajs', food: 'Mat', sleep: 'Sömn', awake: 'Vaken', walk: 'Promenad', training: 'Träning',
  accident: 'Olycka', water: 'Vatten', vaccination: 'Vaccination', deworming: 'Avmaskning', veterinary: 'Veterinär',
};

export function IconChip({ category, size = 'medium', variant = 'default', accidentKinds }: { category: IconCategory; size?: IconChipSize; variant?: IconChipVariant; accidentKinds?: readonly ('pee' | 'poop')[] | null }) {
  const dimension = size === 'large' ? tokens.size.chipLg : tokens.size.chipMd;
  const iconSize = size === 'large' ? tokens.size.iconMd : tokens.size.iconSm;
  const accidentIconSize = size === 'large' ? tokens.size.iconSm : tokens.spacing.md;
  const color = variant === 'rev02-log' ? tokens.colors.log.category[category] : categoryColors[category];
  const icon = categoryIcons[category];
  const preciseAccident = category === 'accident' && variant === 'rev02-log' && accidentKinds !== undefined;
  const accidentLabel = !preciseAccident ? `${categoryLabels[category]}-ikon`
    : accidentKinds === null || accidentKinds.length === 0 ? 'Olycka, typ okänd'
      : `Olycka: ${accidentKinds.map((kind) => kind === 'pee' ? 'Kiss' : 'Bajs').join(' och ')}`;
  return (
    <View accessibilityRole="image" accessibilityLabel={accidentLabel} style={[styles.chip, { width: dimension, minHeight: dimension, backgroundColor: color.bg, borderRadius: tokens.radius.full }]}>
      {category === 'accident' && preciseAccident ? accidentKinds === null || accidentKinds.length === 0
        ? <Ionicons name="help-circle-outline" size={iconSize} color={color.fg} />
        : <View style={styles.accidentIcons}>
          {accidentKinds.includes('pee') ? <Ionicons name="water-outline" size={accidentIconSize} color={color.fg} /> : null}
          {accidentKinds.includes('poop') ? <PoopIcon color={color.fg} size={accidentIconSize} /> : null}
        </View>
        : category === 'accident' ? <View style={styles.accidentIcons}><Ionicons name="water-outline" size={accidentIconSize} color={color.fg} /><PoopIcon color={color.fg} size={accidentIconSize} /></View>
        : icon === 'poop' ? <PoopIcon color={color.fg} size={iconSize} /> : icon === 'medical-outline' ? <PillIcon color={color.fg} size={iconSize} /> : <Ionicons name={icon} size={iconSize} color={color.fg} />}
    </View>
  );
}

const styles = StyleSheet.create({ chip: { minWidth: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center' }, accidentIcons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.size.stroke } });
