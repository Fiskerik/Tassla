import { MotionPressable } from './Motion';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { HorizontalGestureRegion } from './MainSwipeNavigation';
import { tokens } from '../../theme/tokens';
export type TabsVariant = 'underline' | 'rev02-segmented';
export type TabsActiveTone = 'default' | 'home';
export function Tabs({ items, active, onChange, variant = 'underline', activeTone = 'default', accessibilityLabel = 'Avsnitt', layout = 'responsive' }: { items: readonly string[]; active: string; onChange: (item: string) => void; variant?: TabsVariant; activeTone?: TabsActiveTone; accessibilityLabel?: string; layout?: 'responsive' | 'horizontal-scroll' }) {
  const segmented = variant === 'rev02-segmented';
  const homeSegmented = segmented && activeTone === 'home';
  const { width, fontScale } = useWindowDimensions();
  const homeGrid = layout === 'responsive' && homeSegmented && items.length >= 4 && (width < 480 || fontScale >= 1.25);
  const horizontalScroll = layout === 'horizontal-scroll';
  return <HorizontalGestureRegion><ScrollView style={[styles.scroll, segmented && styles.segmentedScroll, homeSegmented && styles.homeSegmentedScroll, (homeGrid || horizontalScroll) && styles.homeGridScroll]}
    horizontal={!homeGrid} showsHorizontalScrollIndicator={false} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}
    contentContainerStyle={[styles.tabs, segmented && styles.segmentedTabs, homeSegmented && !horizontalScroll && styles.homeSegmentedTabs, homeGrid && styles.homeGridTabs, horizontalScroll && styles.horizontalScrollTabs]}>
    {items.map((item) => {
      const selected = item === active;
      return <MotionPressable key={item} accessibilityRole="tab" accessibilityLabel={item} accessibilityState={{ selected }} aria-selected={selected} onPress={() => onChange(item)}
        style={({ pressed }) => [styles.tab, segmented && styles.segmentedTab, homeSegmented && styles.homeSegmentedTab, homeGrid && styles.homeGridTab, horizontalScroll && styles.horizontalScrollTab,
          selected && segmented && styles.segmentedSelected, selected && homeSegmented && styles.homeSegmentedSelected, pressed && styles.pressed]}>
        <Text style={[styles.label, selected && styles.active, selected && segmented && styles.segmentedActive, selected && homeSegmented && styles.homeSegmentedActive]}>{item}</Text>
        {!segmented ? <View style={[styles.underline, selected && styles.selectedUnderline]} /> : null}
      </MotionPressable>;
    })}
  </ScrollView></HorizontalGestureRegion>;
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
  homeSegmentedScroll: { width: '100%' },
  homeSegmentedTabs: { width: '100%', flexGrow: 1 },
  homeSegmentedTab: { flex: 1, minWidth: 0 },
  homeGridScroll: { width: '100%' },
  homeGridTabs: { width: '100%', flexGrow: 1, flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs, padding: tokens.spacing.xs },
  homeGridTab: { flexBasis: '48%', flexGrow: 1, flexShrink: 0, minWidth: 0, minHeight: tokens.size.touchMin },
  horizontalScrollTabs: { flexGrow: 0, flexDirection: 'row', flexWrap: 'nowrap' },
  horizontalScrollTab: { flex: 0, minWidth: tokens.size.touchMin, paddingHorizontal: tokens.spacing.md },
  homeSegmentedSelected: { backgroundColor: tokens.colors.home.greenStrong },
  homeSegmentedActive: { color: tokens.colors.onPrimary },
});


