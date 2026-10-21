import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppBar } from '../../components/ui/AppBar';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { MessageCard, PrimaryButton } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';
import type { InsightsPeriod, InsightsProjection } from './insights-model';

export function InsightsScreen({
  period,
  onPeriodChange,
  onBack,
  status,
  projection,
  error,
  onRetry,
}: {
  period: InsightsPeriod;
  onPeriodChange: (period: InsightsPeriod) => void;
  onBack: () => void;
  status: 'loading' | 'error' | 'ready' | 'partial';
  projection: InsightsProjection | null;
  error?: string;
  onRetry?: () => void;
}) {
  return <>
    <AppBar mode="Back" title="Insikter" onAction={onBack} />
    <Tabs items={['Vecka', 'Månad', 'Sedan start']} active={period} variant="rev02-segmented-strong" onChange={(value) => {
      if (value === 'Vecka' || value === 'Månad' || value === 'Sedan start') onPeriodChange(value);
    }} />
    {status === 'loading' ? <Card variant="home" accessibilityLabel="Hämtar Kiss och Bajs-loggar"><View style={styles.stateCard}><ActivityIndicator color={tokens.colors.primary} /><Text style={styles.body}>Hämtar loggar…</Text></View></Card> : null}
    {status === 'error' ? <>
      <MessageCard tone="error">{error ?? 'Insikter kunde inte hämtas.'}</MessageCard>
      <PrimaryButton title="Försök igen" onPress={() => onRetry?.()} />
    </> : null}
    {projection ? <>
      <Card variant="home" accessibilityLabel={`Kiss och Bajs: ${projection.peeTotal} Kiss, ${projection.poopTotal} Bajs`}>
        <View style={styles.cardHeading}>
          <Text accessibilityRole="header" style={styles.heading}>Kiss &amp; bajs</Text>
          <View style={styles.legend}>
            <LegendItem color={tokens.colors.home.greenFill} label="Kiss" />
            <LegendItem color={tokens.primitives.brown700} label="Bajs" />
          </View>
        </View>
        <InsightsChart projection={projection} />
        <View style={styles.totalRow}>
          <Text style={styles.total}><Text style={styles.peeCount}>{projection.peeTotal}</Text> Kiss</Text>
          <Text style={styles.total}><Text style={styles.poopCount}>{projection.poopTotal}</Text> Bajs</Text>
        </View>
        <Text style={styles.coverage}>{coverageCopy(projection)}</Text>
        {status === 'partial' ? <>
          <Text style={styles.partialNotice}>{partialCopy(projection)}</Text>
          {projection.partialReason !== 'limit' ? <PrimaryButton title="Försök igen" onPress={() => onRetry?.()} /> : null}
        </> : null}
        {status === 'ready' && projection.peeTotal + projection.poopTotal === 0 ? <Text style={styles.empty}>Inga loggar i perioden.</Text> : null}
      </Card>
      <Card variant="home" accessibilityLabel="Sömn: intervall saknas">
        <Text accessibilityRole="header" style={styles.cardTitle}>Sömn</Text>
        <Text style={styles.sleepText}>Tidsintervall för sömnlogg saknas ännu.</Text>
      </Card>
    </> : null}
  </>;
}

function InsightsChart({ projection }: { projection: InsightsProjection }) {
  const max = Math.max(1, ...projection.buckets.map((bucket) => bucket.pee + bucket.poop));
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
    {projection.buckets.map((bucket) => {
      const total = bucket.pee + bucket.poop;
      const peeHeight = total ? Math.max(3, Math.round((bucket.pee / max) * 66)) : 0;
      const poopHeight = total ? Math.max(3, Math.round((bucket.poop / max) * 66)) : 0;
      return <View key={bucket.key} style={styles.bucket}>
        <View style={styles.bars}>
          <View style={[styles.bar, styles.peeBar, { height: peeHeight }]} />
          <View style={[styles.bar, styles.poopBar, { height: poopHeight }]} />
        </View>
        <Text testID={`insights-chart-label-${bucket.key}`} style={[styles.bucketLabel, bucket.partial && styles.partialBucket]} numberOfLines={1}>{bucket.label}{bucket.partial ? '·' : ''}</Text>
      </View>;
    })}
  </ScrollView>;
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendLabel}>{label}</Text></View>;
}

function coverageCopy(projection: InsightsProjection): string {
  if (projection.period === 'Sedan start' && !projection.coverageStartDate) return 'Ingen sparad logghistorik ännu.';
  if (!projection.coverageStartDate || !projection.coverageEndDate) return 'Täckning saknas.';
  if (projection.period === 'Sedan start' && projection.status === 'ready') return `Täcker sparad historik · ${formatDate(projection.coverageStartDate)}–idag`;
  if (projection.status === 'partial') return `Läst intervall · ${formatDate(projection.coverageStartDate)}–${formatDate(projection.coverageEndDate)}`;
  return `Hela perioden · ${formatDate(projection.coverageStartDate)}–${formatDate(projection.coverageEndDate)}`;
}

function partialCopy(projection: InsightsProjection): string {
  if (projection.partialReason === 'limit') return 'Äldre loggar kan saknas. Äldsta stapeln visar bara den lästa delen.';
  return 'Alla loggar kunde inte hämtas. Äldsta stapeln kan vara ofullständig.';
}

function formatDate(value: string): string {
  const [, month, day] = value.split('-').map(Number);
  const labels = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  return `${day} ${labels[month - 1]}`;
}

const styles = StyleSheet.create({
  cardHeading: { gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm },
  heading: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  cardTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.xs },
  legend: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: tokens.radius.full },
  legendLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  chart: { minWidth: '100%', justifyContent: 'space-between', alignItems: 'flex-end', gap: tokens.spacing.xs, paddingTop: tokens.spacing.md, paddingBottom: tokens.spacing.sm },
  bucket: { width: 40, alignItems: 'center', gap: tokens.spacing.xs },
  bars: { width: 28, height: 72, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 3, borderBottomWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  bar: { width: 10, borderTopLeftRadius: tokens.radius.sm, borderTopRightRadius: tokens.radius.sm },
  peeBar: { backgroundColor: tokens.colors.home.greenFill },
  poopBar: { backgroundColor: tokens.primitives.brown700 },
  bucketLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  partialBucket: { color: tokens.colors.warning, fontWeight: '700' },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xl, paddingTop: tokens.spacing.md },
  total: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  peeCount: { color: tokens.colors.home.greenStrong, fontWeight: '700' },
  poopCount: { color: tokens.primitives.brown700, fontWeight: '700' },
  coverage: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  partialNotice: { ...tokens.typography.caption, color: tokens.colors.warning, marginTop: tokens.spacing.sm },
  empty: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
  sleepText: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  stateCard: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  body: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
