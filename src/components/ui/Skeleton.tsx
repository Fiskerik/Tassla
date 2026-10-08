import { StyleSheet, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export function Skeleton({ shape = 'line', lines = 1 }: { shape?: 'line' | 'circle' | 'card' | 'row'; lines?: number }) {
  const count = Math.max(1, lines);
  return <View accessibilityRole="progressbar" accessibilityLabel="Laddar innehåll" style={[styles.wrap, shape === 'row' && styles.row, shape === 'card' && styles.card]}>
    {shape === 'circle' ? <View style={styles.circle} /> : Array.from({ length: count }, (_, index) => <View key={index} style={[styles.line, shape === 'card' && styles.cardLine, shape === 'row' && styles.rowLine]} />)}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: tokens.spacing.sm },
  line: { minHeight: tokens.spacing.md, alignSelf: 'stretch', borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.selectedSurface },
  circle: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.selectedSurface },
  card: { minHeight: tokens.size.heroHeight - tokens.spacing.xxl, padding: tokens.spacing.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.selectedSurface },
  cardLine: { minHeight: tokens.spacing.md },
  row: { minHeight: tokens.size.buttonHeight, padding: tokens.spacing.sm, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.selectedSurface },
  rowLine: { minHeight: tokens.spacing.md },
});
