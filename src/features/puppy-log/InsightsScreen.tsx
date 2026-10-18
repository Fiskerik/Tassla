import { useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppBar, Button, Card, SectionHeader } from '../../components/ui';
import type { DogInsightEventRecord } from '../../data/workspace-data';
import { tokens } from '../../theme/tokens';
import {
  buildInsightBuckets,
  canNavigateInsightsPeriod,
  formatInsightsDate,
  formatInsightsRange,
  getInsightsRange,
  insightsLocalDateKey,
  isValidInsightsTimeZone,
  navigateInsightsAnchor,
  type InsightsPeriod,
} from './insights-model';

type LoadState = 'loading' | 'ready' | 'error';

export function InsightsScreen({ dogName, events, state, timeZone, todayDate, onBack, onRetry }: {
  dogName: string;
  events: readonly DogInsightEventRecord[];
  state: LoadState;
  timeZone: string;
  todayDate: string;
  onBack: () => void;
  onRetry: () => void;
}) {
  const [period, setPeriod] = useState<InsightsPeriod>('week');
  const [anchorDate, setAnchorDate] = useState(todayDate);
  const validTimeZone = isValidInsightsTimeZone(timeZone);
  const localEventDates = useMemo(() => events.map((event) => insightsLocalDateKey(event.occurred_at, timeZone))
    .filter((date): date is string => date !== null), [events, timeZone]);
  const firstEventDate = localEventDates.reduce<string | null>((first, date) => !first || date < first ? date : first, null);
  const range = getInsightsRange(period, anchorDate, todayDate, firstEventDate);
  const buckets = useMemo(() => state === 'ready' && validTimeZone
    ? buildInsightBuckets(events, period, anchorDate, todayDate, timeZone) : [], [anchorDate, events, period, state, timeZone, todayDate, validTimeZone]);
  const maxDailyCount = Math.max(1, ...buckets.map((bucket) => bucket.pee + bucket.poop));
  const periodHasCountableEvents = buckets.some((bucket) => bucket.hasCountableLog);
  const canGoPrevious = canNavigateInsightsPeriod(period, 'previous', anchorDate, todayDate);
  const canGoNext = canNavigateInsightsPeriod(period, 'next', anchorDate, todayDate);
  const periodLabel = range ? formatInsightsRange(period, range) : '';

  const selectPeriod = (next: InsightsPeriod) => {
    setPeriod(next);
    setAnchorDate(todayDate);
  };
  const navigate = (direction: 'previous' | 'next') => {
    if (!canNavigateInsightsPeriod(period, direction, anchorDate, todayDate)) return;
    const next = navigateInsightsAnchor(period, direction, anchorDate);
    if (next) setAnchorDate(next);
  };

  return <View style={styles.screen}>
    <AppBar mode="Back" variant="compact" title="Insikter" actionLabel="Tillbaka till Logg" onAction={onBack} />
    <View style={styles.intro}>
      <Text style={styles.title} accessibilityRole="header">Översikt</Text>
      <Text style={styles.subtitle}>{dogName} · sparade Kiss- och Bajsloggar</Text>
    </View>

    <View style={styles.periods} accessibilityRole="tablist" accessibilityLabel="Välj period">
      <PeriodButton label="Vecka" selected={period === 'week'} onPress={() => selectPeriod('week')} />
      <PeriodButton label="Månad" selected={period === 'month'} onPress={() => selectPeriod('month')} />
      <PeriodButton label="Sedan start" selected={period === 'since-start'} onPress={() => selectPeriod('since-start')} />
    </View>

    {period !== 'since-start' ? <View style={styles.periodNavigator}>
      <Button variant="icon" iconName="chevron-back" label="" accessibilityLabel="Föregående period" disabled={!canGoPrevious} onPress={() => navigate('previous')} />
      <Text style={styles.periodLabel} accessibilityLiveRegion="polite">{periodLabel}</Text>
      <Button variant="icon" iconName="chevron-forward" label="" accessibilityLabel="Nästa period" disabled={!canGoNext} onPress={() => navigate('next')} />
    </View> : <Text style={styles.periodLabel} accessibilityLiveRegion="polite">{periodLabel}</Text>}

    {state === 'loading' ? <Card accessibilityLabel="Hämtar insikter">
      <Text style={styles.body}>Hämtar sparade loggar…</Text>
    </Card> : null}
    {state === 'error' || !validTimeZone ? <Card accessibilityLabel="Insikterna kunde inte hämtas">
      <Text style={styles.error}>{validTimeZone ? 'Insikterna kunde inte hämtas. Ingen delvis graf visas.' : 'Enhetens tidszon kunde inte tolkas, så insikterna visas inte.'}</Text>
      {validTimeZone ? <Button label="Försök igen" accessibilityLabel="Hämta insikter igen" onPress={onRetry} /> : null}
    </Card> : null}
    {state === 'ready' && validTimeZone && events.length === 0 ? <Card accessibilityLabel="Ingen sparad Kiss- eller Bajs-historik">
      <Text style={styles.emptyTitle}>Ingen historik ännu</Text>
      <Text style={styles.body}>När du sparar Kiss eller Bajs i Logg visas händelserna här. Övriga loggtyper ingår inte.</Text>
    </Card> : null}
    {state === 'ready' && validTimeZone && events.length > 0 && range ? <>
      <View style={styles.coverage}>
        <Ionicons name="information-circle-outline" size={tokens.size.iconMd} color={tokens.colors.primary} accessibilityElementsHidden />
        <Text style={styles.coverageText}>Bara sparade loggar visas. Luckor betyder Ej loggat och är inte noll. Olyckor räknas bara när Kiss eller Bajs uttryckligen valts. Tidszon: {timeZone}.</Text>
      </View>
      {!periodHasCountableEvents ? <Card accessibilityLabel="Ingen räknad Kiss- eller Bajslogg i den här perioden">
        <View testID="insights-empty-period">
          <Text style={styles.emptyTitle}>Ingen räknad logg i perioden</Text>
          <Text style={styles.body}>I den här perioden finns ingen räknad Kiss- eller Bajslogg. Dagar utan räknad logg visas som Ej loggat.</Text>
        </View>
      </Card> : null}
      <SectionHeader title="Kiss och Bajs" />
      <Card accessibilityLabel={'Sparade Kiss- och Bajsloggar, ' + periodLabel}>
        <View style={styles.legend}>
          <LegendItem label="Kiss" color={tokens.colors.category.pee.fg} />
          <LegendItem label="Bajs" color={tokens.colors.category.poop.fg} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator accessibilityLabel="Diagram med sparade Kiss- och Bajsloggar">
          <View style={styles.chart} accessibilityElementsHidden>
            {buckets.map((bucket) => <View key={bucket.key} style={styles.chartColumn}>
              <View style={styles.barTrack}>
                {bucket.hasCountableLog ? <>
                  {bucket.pee > 0 ? <View testID={`insights-pee-bar-${bucket.key}`} style={[styles.bar, styles.peeBar, { height: Math.max(3, bucket.pee / maxDailyCount * 96) }]} /> : null}
                  {bucket.poop > 0 ? <View testID={`insights-poop-bar-${bucket.key}`} style={[styles.bar, styles.poopBar, { height: Math.max(3, bucket.poop / maxDailyCount * 96) }]} /> : null}
                </> : <Text style={styles.gapMark}>·</Text>}
              </View>
              <Text style={styles.axisLabel}>{bucket.label}</Text>
            </View>)}
          </View>
        </ScrollView>
        <SectionHeader title="Siffror" />
        <View style={styles.numbers}>
          {buckets.map((bucket) => <View key={bucket.key} style={styles.numberRow} accessibilityLabel={bucketLabel(bucket)}>
            <Text style={styles.numberDate}>{bucketLabel(bucket)}</Text>
            <Text style={styles.numberValue}>{bucket.hasCountableLog ? 'Kiss ' + bucket.pee + ' · Bajs ' + bucket.poop : 'Ej loggat'}</Text>
          </View>)}
        </View>
      </Card>
      <Text style={styles.footerCopy}>Beskrivande sammanställning av den historik som går att läsa just nu. Loggarna visar inte nödvändigtvis alla verkliga händelser.</Text>
    </> : null}
  </View>;
}

function PeriodButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }}
    onPress={onPress} style={({ pressed }) => [styles.periodButton, selected && styles.periodButtonSelected, pressed && styles.periodButtonPressed]}>
    <Text style={[styles.periodText, selected && styles.periodTextSelected]}>{label}</Text>
  </Pressable>;
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return <View style={styles.legendItem}>
    <View style={[styles.legendSwatch, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>;
}

function bucketLabel(bucket: { key: string; startDate: string; endDate: string }) {
  if (bucket.key.length === 7) {
    return new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(new Date(bucket.startDate + 'T12:00:00.000Z'));
  }
  return formatInsightsDate(bucket.startDate);
}

const styles = StyleSheet.create({
  screen: { width: '100%', gap: tokens.spacing.md, paddingBottom: tokens.spacing.xl },
  intro: { gap: tokens.spacing.xs, marginTop: tokens.spacing.md },
  title: { ...tokens.typography.title, color: tokens.colors.textPrimary },
  subtitle: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  periods: { flexDirection: 'row', gap: tokens.spacing.xs, padding: tokens.spacing.xs, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.selectedSurface },
  periodButton: { flex: 1, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.sm, paddingHorizontal: tokens.spacing.xs },
  periodButtonSelected: { backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.primary },
  periodButtonPressed: { opacity: 0.82 },
  periodText: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textAlign: 'center' },
  periodTextSelected: { ...tokens.typography.label, color: tokens.colors.primary },
  periodNavigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  periodLabel: { ...tokens.typography.label, color: tokens.colors.textPrimary, textAlign: 'center', flex: 1 },
  coverage: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.spacing.sm, padding: tokens.spacing.md, backgroundColor: tokens.colors.selectedSurface, borderRadius: tokens.radius.md },
  coverageText: { ...tokens.typography.caption, color: tokens.colors.textPrimary, flex: 1 },
  legend: { flexDirection: 'row', gap: tokens.spacing.lg, marginBottom: tokens.spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  legendSwatch: { width: 12, height: 12, borderRadius: tokens.radius.full },
  legendText: { ...tokens.typography.caption, color: tokens.colors.textPrimary },
  chart: { minHeight: 144, alignItems: 'flex-end', flexDirection: 'row', gap: tokens.spacing.xs, paddingBottom: tokens.spacing.sm },
  chartColumn: { width: 36, alignItems: 'center', gap: tokens.spacing.xs },
  barTrack: { height: 112, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 3, width: '100%', borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  bar: { width: 10, borderTopLeftRadius: tokens.radius.sm, borderTopRightRadius: tokens.radius.sm },
  peeBar: { backgroundColor: tokens.colors.category.pee.fg },
  poopBar: { backgroundColor: tokens.colors.category.poop.fg },
  gapMark: { ...tokens.typography.body, color: tokens.colors.textSecondary, alignSelf: 'center' },
  axisLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary, fontVariant: ['tabular-nums'] },
  numbers: { gap: 0 },
  numberRow: { minHeight: tokens.size.touchMin, justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, gap: tokens.spacing.md },
  numberDate: { ...tokens.typography.caption, color: tokens.colors.textPrimary, flex: 1 },
  numberValue: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textAlign: 'right' },
  footerCopy: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
  emptyTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.xs },
  body: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  error: { ...tokens.typography.body, color: tokens.colors.danger },
});
