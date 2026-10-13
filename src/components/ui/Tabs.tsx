import { MotionPressable } from './Motion';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
export type TabsVariant = 'underline' | 'rev02-segmented';
export function Tabs({ items, active, onChange, variant = 'underline' }: { items: readonly string[]; active: string; onChange: (item: string) => void; variant?: TabsVariant }) {
  const segmented = variant === 'rev02-segmented';
  return <ScrollView style={[styles.scroll, segmented && styles.segmentedScroll]} horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" accessibilityLabel="Avsnitt" contentContainerStyle={[styles.tabs, segmented && styles.segmentedTabs]}>{items.map((item) => { const selected = item === active; return <MotionPressable key={item} accessibilityRole="tab" accessibilityLabel={item} accessibilityState={{ selected }} onPress={() => onChange(item)} style={({ pressed }) => [styles.tab, segmented && styles.segmentedTab, selected && segmented && styles.segmentedSelected, pressed && styles.pressed]}><Text style={[styles.label, selected && styles.active, selected && segmented && styles.segmentedActive]}>{item}</Text>{!segmented ? <View style={[styles.underline, selected && styles.selectedUnderline]} /> : null}</MotionPressable>; })}</ScrollView>;
}
const styles = StyleSheet.create({
  scroll: { flexGrow: 0, marginBottom: tokens.spacing.lg },
  tabs: { alignItems: 'stretch', gap: tokens.spacing.xs },
  tab: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, justifyContent: 'flex-end', paddingTop: tokens.spacing.sm, paddingHorizontal: tokens.spacing.sm },
  label: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textAlign: 'center' },
  active: { color: tokens.colors.primary, fontWeight: '700' },
  underline: { height: tokens.size.stroke, marginTop: tokens.spacing.sm },
  selectedUnderline: { backgroundColor: tokens.colors.primary },
  pressed: { opacity: 0.75 },
  segmentedScroll: { marginBottom: tokens.spacing.md },
  segmentedTabs: { alignItems: 'center', gap: tokens.spacing.xs, padding: tokens.spacing.xs, backgroundColor: tokens.colors.training.segmentedSurface, borderRadius: tokens.radius.full },
  segmentedTab: { flexGrow: 1, minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, justifyContent: 'center', alignItems: 'center', paddingTop: 0, borderRadius: tokens.radius.full },
  segmentedSelected: { backgroundColor: tokens.colors.training.selectedSurface },
  segmentedActive: { color: tokens.colors.training.accent },
});
