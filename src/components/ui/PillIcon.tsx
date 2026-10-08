import { StyleSheet, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export function PillIcon({ color, size = tokens.size.iconSm }: { color: string; size?: number }) {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.icon, { width: size, height: size }]}><View style={[styles.pill, { width: size * 0.72, height: size * 0.42, borderColor: color, borderRadius: size }]}><View style={[styles.split, { backgroundColor: color }]} /></View></View>;
}

const styles = StyleSheet.create({ icon: { alignItems: 'center', justifyContent: 'center' }, pill: { borderWidth: tokens.size.stroke * 2, transform: [{ rotate: '-45deg' }], overflow: 'hidden' }, split: { position: 'absolute', left: '47%', top: -1, bottom: -1, width: tokens.size.stroke * 2 }, });
