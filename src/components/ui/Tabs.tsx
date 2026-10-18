import { useCallback, useEffect, useRef } from 'react';
import { MotionPressable } from './Motion';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HorizontalGestureRegion } from './MainSwipeNavigation';
import { tokens } from '../../theme/tokens';

export type TabsVariant = 'underline' | 'rev02-segmented' | 'rev02-segmented-wrap';

type TabsProps = { items: readonly string[]; active: string; onChange: (item: string) => void; variant?: TabsVariant };

export function Tabs({ items, active, onChange, variant = 'underline' }: TabsProps) {
  const segmented = variant !== 'underline';
  const wrapped = variant === 'rev02-segmented-wrap';
  const scrollRef = useRef<ScrollView>(null);
  const tabBounds = useRef(new Map<string, { x: number; width: number }>());
  const viewportWidth = useRef(0);
  const scrollOffset = useRef(0);
  const lastActive = useRef(active);

  const revealActive = useCallback(() => {
    if (wrapped) return;
    const selected = tabBounds.current.get(active);
    const viewport = viewportWidth.current;
    if (!selected || viewport <= 0) return;
    const left = scrollOffset.current;
    const right = left + viewport;
    let target = left;
    if (selected.x < left) target = selected.x;
    else if (selected.x + selected.width > right) target = selected.x + selected.width - viewport;
    if (Math.abs(target - left) > 1) scrollRef.current?.scrollTo({ x: Math.max(0, target), animated: false });
  }, [active, wrapped]);

  useEffect(() => {
    if (lastActive.current === active) return;
    lastActive.current = active;
    revealActive();
  }, [active, revealActive]);

  const tabItems = items.map((item) => {
    const selected = item === active;
    const keyboardActivation = {
      onKeyDown: (event: { key: string; preventDefault: () => void }) => {
        if (event.key !== ' ' && event.key !== 'Spacebar') return;
        event.preventDefault();
        onChange(item);
      },
    };
    return <MotionPressable key={item}
      {...keyboardActivation}
      onLayout={wrapped ? undefined : (event) => { const { x, width } = event.nativeEvent.layout; tabBounds.current.set(item, { x, width }); if (selected) revealActive(); }}
      accessibilityRole="tab" accessibilityLabel={item} accessibilityState={{ selected }} aria-selected={selected} onPress={() => onChange(item)}
      style={({ pressed }) => [styles.tab, segmented && styles.segmentedTab, wrapped && styles.wrappedTab,
        selected && segmented && styles.segmentedSelected, pressed && styles.pressed]}>
      <Text style={[styles.label, selected && styles.active, selected && segmented && styles.segmentedActive]}>{item}</Text>
    </MotionPressable>;
  });

  if (wrapped) return <HorizontalGestureRegion><View accessibilityRole="tablist" accessibilityLabel="Avsnitt" style={styles.wrappedTabs}>{tabItems}</View></HorizontalGestureRegion>;

  return <HorizontalGestureRegion><ScrollView ref={scrollRef} style={[styles.scroll, segmented && styles.segmentedScroll]} horizontal
    showsHorizontalScrollIndicator={false} accessibilityRole="tablist" accessibilityLabel="Avsnitt"
    contentContainerStyle={[styles.tabs, segmented && styles.segmentedTabs]}
    onLayout={(event) => { viewportWidth.current = event.nativeEvent.layout.width; revealActive(); }}
    onScroll={(event) => { scrollOffset.current = event.nativeEvent.contentOffset.x; }} scrollEventThrottle={16}>
    {tabItems}
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
  wrappedTabs: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: tokens.spacing.xs, padding: tokens.spacing.xs, marginBottom: tokens.spacing.md, backgroundColor: tokens.colors.training.segmentedSurface, borderRadius: tokens.radius.md },
  wrappedTab: { flexGrow: 1, flexShrink: 0, flexBasis: 'auto', minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, justifyContent: 'center', alignItems: 'center', paddingHorizontal: tokens.spacing.sm, paddingVertical: tokens.spacing.xs, borderRadius: tokens.radius.full },
  segmentedSelected: { backgroundColor: tokens.colors.training.selectedSurface },
  segmentedActive: { color: tokens.colors.training.accent },
});
