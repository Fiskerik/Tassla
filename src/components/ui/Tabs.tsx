import { MotionPressable } from './Motion';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { HorizontalGestureRegion } from './MainSwipeNavigation';
import { tokens } from '../../theme/tokens';
export type TabsVariant = 'underline' | 'rev02-segmented';
export type TabsActiveTone = 'default' | 'home';
export function Tabs({ items, active, onChange, variant = 'underline', activeTone = 'default', accessibilityLabel = 'Avsnitt', scrollable = false }: { items: readonly string[]; active: string; onChange: (item: string) => void; variant?: TabsVariant; activeTone?: TabsActiveTone; accessibilityLabel?: string; scrollable?: boolean }) {
  const segmented = variant === 'rev02-segmented';
  const homeSegmented = segmented && activeTone === 'home';
  const { width, fontScale } = useWindowDimensions();
  const homeGrid = homeSegmented && !scrollable && items.length >= 4 && (width < 480 || fontScale >= 1.25);
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef(new Map<string, { x: number; width: number }>());
  const scrollOffset = useRef(0);
  const [scrollViewportWidth, setScrollViewportWidth] = useState(0);
  const [scrollLayoutRevision, setScrollLayoutRevision] = useState(0);

  useEffect(() => {
    if (!scrollable || scrollViewportWidth <= 0) return;
    const tabLayout = tabLayouts.current.get(active);
    if (!tabLayout) return;
    const visibleLeft = scrollOffset.current;
    const visibleRight = visibleLeft + scrollViewportWidth;
    if (tabLayout.x < visibleLeft) {
      const x = Math.max(0, tabLayout.x);
      scrollRef.current?.scrollTo({ x, animated: false });
    } else if (tabLayout.x + tabLayout.width > visibleRight) {
      scrollRef.current?.scrollTo({ x: tabLayout.x + tabLayout.width - scrollViewportWidth, animated: false });
    }
  }, [active, scrollable, scrollLayoutRevision, scrollViewportWidth]);

  function recordTabLayout(item: string, event: LayoutChangeEvent) {
    if (!scrollable) return;
    const { x, width: tabWidth } = event.nativeEvent.layout;
    tabLayouts.current.set(item, { x, width: tabWidth });
    setScrollLayoutRevision((revision) => revision + 1);
  }

  return <HorizontalGestureRegion><ScrollView style={[styles.scroll, segmented && styles.segmentedScroll, homeSegmented && styles.homeSegmentedScroll, homeGrid && styles.homeGridScroll]}
    ref={scrollable ? scrollRef : undefined}
    onLayout={scrollable ? (event) => setScrollViewportWidth(event.nativeEvent.layout.width) : undefined}
    onScroll={scrollable ? (event) => { scrollOffset.current = event.nativeEvent.contentOffset.x; } : undefined}
    onContentSizeChange={scrollable ? () => setScrollLayoutRevision((revision) => revision + 1) : undefined}
    scrollEventThrottle={scrollable ? 16 : undefined}
    horizontal={!homeGrid} showsHorizontalScrollIndicator={false} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}
    contentContainerStyle={[styles.tabs, segmented && styles.segmentedTabs, homeSegmented && !scrollable && styles.homeSegmentedTabs, scrollable && styles.scrollableTabs, homeGrid && styles.homeGridTabs]}>
    {items.map((item) => {
      const selected = item === active;
      return <MotionPressable key={item} accessibilityRole="tab" accessibilityLabel={item} accessibilityState={{ selected }} aria-selected={selected} onPress={() => onChange(item)}
        onLayout={scrollable ? (event) => recordTabLayout(item, event) : undefined}
        style={({ pressed }) => [styles.tab, segmented && styles.segmentedTab, homeSegmented && !scrollable && styles.homeSegmentedTab, scrollable && styles.scrollableTab, homeGrid && styles.homeGridTab,
          selected && segmented && styles.segmentedSelected, selected && homeSegmented && styles.homeSegmentedSelected, pressed && styles.pressed]}>
        <Text numberOfLines={scrollable ? 1 : undefined} style={[styles.label, scrollable && styles.scrollableLabel, selected && styles.active, selected && segmented && styles.segmentedActive, selected && homeSegmented && styles.homeSegmentedActive]}>{item}</Text>
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
  scrollableTabs: { flexGrow: 0, alignSelf: 'flex-start' },
  scrollableTab: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, paddingHorizontal: tokens.spacing.md },
  scrollableLabel: { ...tokens.typography.smallCaption },
  homeGridScroll: { width: '100%' },
  homeGridTabs: { width: '100%', flexGrow: 1, flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs, padding: tokens.spacing.xs },
  homeGridTab: { flexBasis: '48%', flexGrow: 1, flexShrink: 0, minWidth: 0, minHeight: tokens.size.touchMin },
  homeSegmentedSelected: { backgroundColor: tokens.colors.home.greenStrong },
  homeSegmentedActive: { color: tokens.colors.onPrimary },
});
