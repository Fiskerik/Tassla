import { StyleSheet, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export function PoopIcon({ color, size = tokens.size.iconSm }: { color: string; size?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, justifyContent: 'flex-end', alignItems: 'center' }}>
      <View style={[styles.base, { borderColor: color, width: size * 0.72, height: size * 0.46, borderRadius: tokens.radius.full }]}>
        <View style={[styles.leftEye, { backgroundColor: color }]} />
        <View style={[styles.rightEye, { backgroundColor: color }]} />
      </View>
      <View style={[styles.tip, { backgroundColor: color, width: size * 0.28, height: size * 0.18, borderRadius: tokens.radius.full }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: tokens.size.stroke, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-evenly' },
  leftEye: { width: tokens.size.stroke, height: tokens.size.stroke },
  rightEye: { width: tokens.size.stroke, height: tokens.size.stroke },
  tip: { marginBottom: -tokens.spacing.xs },
});
