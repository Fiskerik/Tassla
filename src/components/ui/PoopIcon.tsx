import { StyleSheet, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export function PoopIcon({ color, size = tokens.size.iconSm }: { color: string; size?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.icon, { width: size, height: size }]}>
      <View style={[styles.tier, { borderColor: color, width: size * 0.44, height: size * 0.28, borderRadius: size * 0.16 }]} />
      <View style={[styles.tier, styles.middle, { borderColor: color, width: size * 0.66, height: size * 0.28, borderRadius: size * 0.16 }]} />
      <View style={[styles.tier, styles.bottom, { borderColor: color, width: size * 0.88, height: size * 0.28, borderRadius: size * 0.16 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: 'center', justifyContent: 'flex-end' },
  tier: { borderWidth: tokens.size.stroke * 2, position: 'absolute', top: 0 },
  middle: { top: '26%' },
  bottom: { top: '52%' },
});
