import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useCallback, useEffect, useRef } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card } from '../../components/ui';
import { MessageCard, PrimaryButton } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';
import {
  formatInsightsDate,
  formatInsightsMonth,
  formatInsightsMonthTick,
  historyMonthEntries,
  insightVisibleTotals,
  insightsDateRange,
  type DogEventInsightDay,
  type DogEventInsights,
  type InsightsPeriod,
} from './insights-model';

export type InsightsLoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: DogEventInsights };

const PERIOD_OPTIONS: readonly { key: InsightsPeriod; label: string }[] = [
  { key: 'week', label: 'Vecka' },
  { key: 'month', label: 'Månad' },
  { key: 'since_first_log', label: 'Sedan första loggen' },
];

type Series = { key: 'peeCount' | 'poopCount' | 'sleepCount' | 'awakeCount'; label: string; color: string };

export function InsightsScreen({
  period,
  onPeriodChange,
  state,
  onRefresh,
  onOpenLog,
  onBack,
  backLabel,
  dogName,
}: {
  period: InsightsPeriod;
  onPeriodChange: (period: InsightsPeriod) => void;
  state: InsightsLoadState;
  onRefresh: () => void;
  onOpenLog: () => void;
  onBack: () => void;
  backLabel: string;
  dogName: string;
}) {
  const data = state.status === 'ready' ? state.data : null;
  const totals = data ? insightVisibleTotals(data.days) : null;
  const historyEntries = data?.period === 'since_first_log' ? historyMonthEntries(data) : null;
  const visibleBackLabel = backLabel === 'Tillbaka till Hundprofil' ? 'Hundprofil'
    : backLabel === 'Tillbaka till Logga' ? 'Logga' : backLabel;

  return <View style={styles.screen}>
    <View style={styles.navigationRow}>
      <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={tokens.size.iconMd} color={tokens.colors.textPrimary} />
        <Text style={styles.backLabel}>{visibleBackLabel}</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>Insikter</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Uppdatera insikter" onPress={onRefresh}
        disabled={state.status === 'loading'} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed, state.status === 'loading' && styles.disabled]}>
        {state.status === 'loading' ? <ActivityIndicator size="small" color={tokens.colors.primary} />
          : <Ionicons name="refresh-outline" size={tokens.size.iconMd} color={tokens.colors.primary} />}
      </Pressable>
    </View>
    <Text style={styles.subtitle}>Registreringar över tid med {dogName}.</Text>

    <View style={styles.periodControl} accessibilityRole="tablist" accessibilityLabel="Period för insikter">
      {PERIOD_OPTIONS.map((option) => {
        const selected = option.key === period;
        return <Pressable key={option.key} accessibilityRole="tab" accessibilityLabel={option.label}
          accessibilityState={{ selected }} aria-selected={selected} onPress={() => onPeriodChange(option.key)}
          style={({ pressed }) => [styles.periodOption, selected && styles.periodSelected, pressed && styles.pressed]}>
          <Text style={[styles.periodLabel, selected && styles.periodLabelSelected]}>{option.label}</Text>
        </Pressable>;
      })}
    </View>

    {state.status === 'loading' ? <Card accessibilityLabel="Hämtar insikter">
      <View style={styles.loadingState}><ActivityIndicator color={tokens.colors.primary} /><Text style={styles.body}>Hämtar registreringar…</Text></View>
    </Card> : null}

    {state.status === 'error' ? <Card>
      <Text accessibilityRole="header" style={styles.cardTitle}>Insikterna kunde inte hämtas</Text>
      <Text style={styles.body}>Försök igen när anslutningen fungerar.</Text>
      <View style={styles.actionGap}><PrimaryButton title="Försök igen" onPress={onRefresh} /></View>
    </Card> : null}

    {data ? <>
      <View style={styles.periodSummary} accessible accessibilityRole="text"
        accessibilityLabel={`${insightsDateRange(data)}. Visar data till och med ${formatInsightsDate(data.observedThroughLocal, true)}. ${data.period === 'week' ? 'Veckan pågår.' : `${formatInsightsMonth(data.observedThroughLocal.slice(0, 7))} pågår.`}`}>
        <Text style={styles.rangeLabel}>{insightsDateRange(data)}</Text>
        <Text style={styles.coverageLabel}>Visar data till och med {formatInsightsDate(data.observedThroughLocal, true)} · {data.period === 'week' ? 'veckan pågår' : `${formatInsightsMonth(data.observedThroughLocal.slice(0, 7))} pågår`}</Text>
      </View>

      {data.period === 'since_first_log' && data.days.length === 0 ? <Card>
        <View style={styles.emptyIcon}><Ionicons name="bar-chart-outline" size={tokens.size.iconMd} color={tokens.colors.primary} /></View>
        <Text accessibilityRole="header" style={styles.cardTitle}>Du har inga registreringar ännu</Text>
        <Text style={styles.body}>När du loggar händelser visas en översikt här.</Text>
        <View style={styles.actionGap}><PrimaryButton title="Logga" onPress={onOpenLog} /></View>
      </Card> : <>
        <ChartCard
          title="Kiss och bajs"
          subtitle="Antal registrerade händelser"
          entries={data.period === 'since_first_log' ? (historyEntries ?? []) : data.days.map((item) => ({ kind: 'month' as const, item }))}
          period={data.period}
          series={[
            { key: 'peeCount', label: 'Kiss', color: tokens.colors.home.greenFill },
            { key: 'poopCount', label: 'Bajs', color: tokens.colors.log.category.poop.fg },
          ]}
          emptyText="Inga kiss-, bajs- eller olycksmarkeringar i perioden."
          showOtherTypesNote={data.period === 'since_first_log'}
          observedThrough={data.observedThroughLocal}
        />
        {totals && totals.accident > 0 ? <MessageCard>
          {`${totals.accident} oklassificerad ${totals.accident === 1 ? 'olycka visas' : 'olyckor visas'} separat och ingår inte i Kiss eller Bajs.`}
        </MessageCard> : null}

        <ChartCard
          title="Sömnmarkeringar"
          subtitle="Visar registreringar, inte sovtid."
          entries={data.period === 'since_first_log' ? (historyEntries ?? []) : data.days.map((item) => ({ kind: 'month' as const, item }))}
          period={data.period}
          series={[
            { key: 'sleepCount', label: 'Sömn', color: tokens.colors.category.pee.fg },
            { key: 'awakeCount', label: 'Vaken', color: tokens.colors.category.sleep.fg },
          ]}
          emptyText="Inga sömn- eller vakenmarkeringar i perioden."
          showOtherTypesNote={false}
          observedThrough={data.observedThroughLocal}
        />
      </>}
    </> : null}
  </View>;
}

type ChartEntry = { kind: 'month'; item: DogEventInsightDay } | { kind: 'gap'; startMonth: string; endMonth: string; count: number };

function ChartCard({ title, subtitle, entries, period, series, emptyText, showOtherTypesNote, observedThrough }: {
  title: string;
  subtitle: string;
  entries: readonly ChartEntry[];
  period: InsightsPeriod;
  series: readonly Series[];
  emptyText: string;
  showOtherTypesNote: boolean;
  observedThrough: string;
}) {
  const points = entries.filter((entry): entry is Extract<ChartEntry, { kind: 'month' }> => entry.kind === 'month').map((entry) => entry.item);
  const total = insightVisibleTotals(points);
  const countBySeries = (key: Series['key']) => points.reduce((sum, point) => sum + point[key], 0);
  const hasVisibleCount = series.some((item) => countBySeries(item.key) > 0)
    || (series[0]?.key === 'peeCount' && total.accident > 0);
  const maximum = Math.max(1, ...points.flatMap((point) => series.map((item) => point[item.key])));
  const wideTimeline = period === 'since_first_log' || points.length > 12;
  const itemWidth = period === 'since_first_log' ? 52 : points.length > 12 ? 40 : undefined;
  const hasOtherTypes = showOtherTypesNote && points.length > 0 && points.every((point) => point.peeCount === 0
    && point.poopCount === 0 && point.unclassifiedAccidentCount === 0 && point.sleepCount === 0 && point.awakeCount === 0);
  const shouldRenderTimeline = hasVisibleCount || period === 'since_first_log';
  const timelineKey = entries.map((entry) => entry.kind === 'gap' ? `${entry.startMonth}:${entry.endMonth}` : entry.item.date).join('|');
  const timelineRef = useRef<ScrollView>(null);
  const scrollToLatest = useCallback(() => {
    if (!wideTimeline) return;
    requestAnimationFrame(() => timelineRef.current?.scrollToEnd({ animated: false }));
  }, [wideTimeline]);
  useEffect(() => { scrollToLatest(); }, [period, scrollToLatest, timelineKey]);

  return <Card accessibilityLabel={`${title}. ${series.map((item) => `${item.label} ${countBySeries(item.key)}`).join(', ')}`}>
    <Text accessibilityRole="header" style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>
    <View style={styles.legend}>
      {series.map((item) => <View key={item.key} style={styles.legendItem}>
        <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
        <Text style={styles.legendLabel}>{item.label} · {countBySeries(item.key)}</Text>
      </View>)}
    </View>
    {entries.length === 0 || !shouldRenderTimeline ? <View style={styles.chartEmpty}>
      <Text style={styles.body}>{hasOtherTypes ? 'Andra typer registrerades under den här perioden.' : emptyText}</Text>
    </View> : <ScrollView ref={timelineRef} horizontal={wideTimeline} showsHorizontalScrollIndicator={wideTimeline}
      onContentSizeChange={scrollToLatest} contentContainerStyle={[styles.chartScroll, wideTimeline && styles.chartScrollWide]}>
      <View style={styles.chart} accessibilityLabel={`${title}, ${series.map((item) => `${item.label} ${countBySeries(item.key)}`).join(', ')}`}>
        <View style={styles.axis}>
          <Text style={styles.axisLabel}>{maximum}</Text>
          <Text style={styles.axisLabel}>0</Text>
        </View>
        {entries.map((entry) => entry.kind === 'gap'
          ? <View key={`gap:${entry.startMonth}`} style={[styles.gapColumn, itemWidth ? { width: itemWidth } : null]}
            accessible accessibilityRole="text" accessibilityLabel={`${entry.count} ${entry.count === 1 ? 'månad' : 'månader'} utan registreringar, ${formatInsightsMonth(entry.startMonth, true)} till ${formatInsightsMonth(entry.endMonth, true)}`}>
            <View style={styles.gapMarker}><Text style={styles.gapCount}>{entry.count}</Text></View>
            <Text style={styles.gapLabel}>{entry.count} mån.</Text>
          </View>
          : <ChartColumn key={entry.item.date} item={entry.item} period={period} series={series} maximum={maximum} itemWidth={itemWidth} observedThrough={observedThrough} showOtherTypesNote={showOtherTypesNote} />)}
      </View>
    </ScrollView>}
  </Card>;
}

function ChartColumn({ item, period, series, maximum, itemWidth, observedThrough, showOtherTypesNote }: {
  item: DogEventInsightDay;
  period: InsightsPeriod;
  series: readonly Series[];
  maximum: number;
  itemWidth?: number;
  observedThrough: string;
  showOtherTypesNote: boolean;
}) {
  const label = period === 'since_first_log'
    ? `${formatInsightsMonth(item.date)} ${item.date.slice(0, 4)}`
    : `${new Intl.DateTimeFormat('sv-SE', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${item.date}T12:00:00Z`)).replace('.', '')} ${Number(item.date.slice(8))}`;
  const visibleLabel = period === 'since_first_log'
    ? `${formatInsightsMonthTick(item.date)}\n${item.date.slice(2, 4)}` : label;
  const valueSummary = series.map((entry) => `${entry.label} ${item[entry.key]}`).join(', ');
  const otherTypesThisMonth = showOtherTypesNote && item.peeCount === 0 && item.poopCount === 0
    && item.unclassifiedAccidentCount === 0 && item.sleepCount === 0 && item.awakeCount === 0;
  const isOngoing = period === 'since_first_log'
    ? item.date === observedThrough.slice(0, 7)
    : item.date === observedThrough;
  return <View style={[styles.chartColumn, itemWidth ? { width: itemWidth } : null]}
    accessible accessibilityRole="text" accessibilityLabel={`${label}${isOngoing ? ', pågående' : ''}: ${valueSummary}${otherTypesThisMonth ? ', andra typer registrerades den här månaden' : ''}`}>
    <View style={styles.barArea}>
      <View style={styles.gridLineTop} />
      <View style={styles.gridLineMiddle} />
      <View style={styles.barGroup}>
        {series.map((entry) => {
          const count = item[entry.key];
          return <View key={entry.key} style={[styles.bar, { backgroundColor: entry.color, height: count === 0 ? 0 : Math.max(3, (count / maximum) * 78) }]} />;
        })}
      </View>
      <View style={styles.gridLineBase} />
    </View>
    <Text numberOfLines={2} style={styles.xLabel}>{visibleLabel}</Text>
    {isOngoing ? <Text style={styles.ongoingLabel}>Pågår</Text> : null}
    {otherTypesThisMonth ? <Text style={styles.otherTypes}>Andra</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  screen: { gap: tokens.spacing.md },
  navigationRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  backButton: { minHeight: tokens.size.touchMin, minWidth: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, maxWidth: '38%' },
  backLabel: { ...tokens.typography.caption, color: tokens.colors.primary, flexShrink: 1 },
  title: { ...tokens.typography.heading, color: tokens.colors.textPrimary, textAlign: 'center', flex: 1 },
  refreshButton: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.selectedSurface },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.6 },
  subtitle: { ...tokens.typography.body, color: tokens.colors.textSecondary, marginTop: -tokens.spacing.sm },
  periodControl: { flexDirection: 'row', alignItems: 'stretch', borderRadius: tokens.radius.full, padding: tokens.spacing.xs, backgroundColor: tokens.colors.training.segmentedSurface },
  periodOption: { minWidth: 0, minHeight: tokens.size.touchMin, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.xs, paddingVertical: tokens.spacing.xs, borderRadius: tokens.radius.full },
  periodSelected: { backgroundColor: tokens.colors.surface },
  periodLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textAlign: 'center' },
  periodLabelSelected: { color: tokens.colors.primary, fontWeight: '700' },
  periodSummary: { gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.xs },
  rangeLabel: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  coverageLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  loadingState: { minHeight: tokens.size.touchMin + tokens.spacing.md, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  body: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  cardTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  cardSubtitle: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: tokens.spacing.md, rowGap: tokens.spacing.xs, marginTop: tokens.spacing.md },
  legendItem: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  legendSwatch: { width: tokens.spacing.sm, height: tokens.spacing.sm, borderRadius: tokens.radius.full },
  legendLabel: { ...tokens.typography.caption, color: tokens.colors.textPrimary },
  chartScroll: { flexGrow: 1, paddingTop: tokens.spacing.sm },
  chartScrollWide: { minWidth: '100%' },
  chart: { minHeight: 138, flexDirection: 'row', alignItems: 'stretch', gap: tokens.spacing.xs, paddingRight: tokens.spacing.xs },
  axis: { width: tokens.spacing.lg, justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 24 },
  axisLabel: { ...tokens.typography.smallCaption, color: tokens.colors.textSecondary },
  chartColumn: { minWidth: 28, flex: 1, alignItems: 'center' },
  barArea: { width: '100%', height: 100, justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  gridLineTop: { position: 'absolute', top: 0, left: 0, right: 0, borderTopWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  gridLineMiddle: { position: 'absolute', top: 50, left: 0, right: 0, borderTopWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  gridLineBase: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong },
  barGroup: { minHeight: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 3, zIndex: 1 },
  bar: { width: 8, maxHeight: 78, borderTopLeftRadius: tokens.radius.sm, borderTopRightRadius: tokens.radius.sm },
  xLabel: { ...tokens.typography.smallCaption, minHeight: 30, color: tokens.colors.textSecondary, textAlign: 'center', marginTop: tokens.spacing.xs },
  ongoingLabel: { ...tokens.typography.smallCaption, color: tokens.colors.primary, fontWeight: '700', textAlign: 'center' },
  gapColumn: { minWidth: 48, flex: 1, alignItems: 'center', justifyContent: 'center' },
  gapMarker: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.warningSurface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.warning },
  gapCount: { ...tokens.typography.label, color: tokens.colors.warning },
  gapLabel: { ...tokens.typography.smallCaption, color: tokens.colors.textSecondary, textAlign: 'center', marginTop: tokens.spacing.xs },
  chartEmpty: { paddingVertical: tokens.spacing.md },
  otherTypes: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
  emptyIcon: { width: tokens.size.chipLg, height: tokens.size.chipLg, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.selectedSurface, marginBottom: tokens.spacing.sm },
  actionGap: { marginTop: tokens.spacing.md },
});
