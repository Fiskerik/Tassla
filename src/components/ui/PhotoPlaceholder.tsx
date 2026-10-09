import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../../theme/tokens';

export function PhotoPlaceholder({ shape = 'circle' }: { shape?: 'circle' | 'rounded' }) {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.placeholder, shape === 'rounded' ? styles.rounded : styles.circle]}><Ionicons name="paw-outline" size={tokens.size.chipLg} color={tokens.colors.primary} /></View>;
}

const styles = StyleSheet.create({
  placeholder: { width: tokens.size.chipLg * 2, height: tokens.size.chipLg * 2, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.selectedSurface },
  circle: { borderRadius: tokens.radius.full },
  rounded: { borderRadius: tokens.radius.lg },
});
