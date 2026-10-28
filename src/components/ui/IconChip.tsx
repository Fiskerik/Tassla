import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { categoryColors, tokens } from '../../theme/tokens';
import { PoopIcon } from './PoopIcon';
import { PillIcon } from './PillIcon';

const peeDropPaths = [
  'M12 2.5 C10.3 5.3 9 7 9 8.8 A3 3 0 0 0 15 8.8 C15 7 13.7 5.3 12 2.5 Z',
  'M5.75 11 C4 13.8 2.5 15.7 2.5 17.8 A3.25 3.25 0 0 0 9 17.8 C9 15.7 7.5 13.8 5.75 11 Z',
  'M18.25 11 C16.5 13.8 15 15.7 15 17.8 A3.25 3.25 0 0 0 21.5 17.8 C21.5 15.7 20 13.8 18.25 11 Z',
] as const;

function PeeIcon({ color, size = tokens.size.iconSm }: { color: string; size?: number }) {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.peeIcon, { width: size, height: size }]}>
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      {peeDropPaths.map((path, index) => <Path key={`pee-drop-${index}`} d={path} fill={color} />)}
    </Svg>
  </View>;
}

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
  const decorativeLogPee = category === 'pee' && variant === 'rev02-log';
  const preciseAccident = category === 'accident' && variant === 'rev02-log' && accidentKinds !== undefined;
  const accidentLabel = !preciseAccident ? `${categoryLabels[category]}-ikon`
    : accidentKinds === null || accidentKinds.length === 0 ? 'Olycka, typ okänd'
      : `Olycka: ${accidentKinds.map((kind) => kind === 'pee' ? 'Kiss' : 'Bajs').join(' och ')}`;
  return (
    <View accessibilityElementsHidden={decorativeLogPee} importantForAccessibility={decorativeLogPee ? 'no-hide-descendants' : 'auto'} accessibilityRole={decorativeLogPee ? undefined : 'image'} accessibilityLabel={decorativeLogPee ? undefined : accidentLabel} style={[styles.chip, { width: dimension, minHeight: dimension, backgroundColor: color.bg, borderRadius: tokens.radius.full }]}>
      {category === 'accident' && preciseAccident ? accidentKinds === null || accidentKinds.length === 0
        ? <Ionicons name="help-circle-outline" size={iconSize} color={color.fg} />
        : <View style={styles.accidentIcons}>
          {accidentKinds.includes('pee') ? <PeeIcon color={color.fg} size={accidentIconSize} /> : null}
          {accidentKinds.includes('poop') ? <PoopIcon color={color.fg} size={accidentIconSize} /> : null}
        </View>
        : category === 'accident' ? <View style={styles.accidentIcons}><PeeIcon color={color.fg} size={accidentIconSize} /><PoopIcon color={color.fg} size={accidentIconSize} /></View>
        : category === 'pee' && variant === 'rev02-log' ? <PeeIcon color={color.fg} size={iconSize} />
        : icon === 'poop' ? <PoopIcon color={color.fg} size={iconSize} /> : icon === 'medical-outline' ? <PillIcon color={color.fg} size={iconSize} /> : <Ionicons name={icon} size={iconSize} color={color.fg} />}
    </View>
  );
}

const styles = StyleSheet.create({ chip: { minWidth: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center' }, accidentIcons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.size.stroke }, peeIcon: { alignItems: 'center', justifyContent: 'center' } });
