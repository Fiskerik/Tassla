import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
export function Progress({ value, label }: { value: number; label: string }) {
  const bounded = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: bounded }} style={styles.wrap}><View style={styles.track}><View style={[styles.fill, { width: `${bounded}%` }]} /></View><Text style={styles.label}>{label}</Text></View>;
}
const styles = StyleSheet.create({ wrap: { alignSelf: 'stretch', gap: tokens.spacing.sm }, track: { height: tokens.size.progress, overflow: 'hidden', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.border }, fill: { height: tokens.size.progress, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.success }, label: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 } });
