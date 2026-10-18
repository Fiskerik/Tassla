import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Circle } from 'react-native-svg';
import { AppBar, Button, Card, IconChip, Skeleton } from '../../components/ui';
import { MessageCard } from '../../components/AppPrimitives';
import { MotionPressable } from '../../components/ui/Motion';
import type { DailyRoutineDay } from './daily-activity-data';
import { dailyActivityProgressLabel, summarizeDailyActivityProgress, type HomeDailyActivity } from './daily-activity-model';
import { routineIconCategory } from './checklist-presentation';
import { tokens } from '../../theme/tokens';

type Props = {
  dogName: string;
  dateKey: string;
  state: 'hidden' | 'loading' | 'ready' | 'error';
  refreshing: boolean;
  refreshError: boolean;
  activities: readonly HomeDailyActivity[];
  mutationBusy: boolean;
  mutationKey: string;
  mutationMessage: string;
  mutationError: boolean;
  trainingTargetFeedback?: { activityId: string; message: string } | null;
  onBack: () => void;
  onRetry: () => void;
  onSetRoutineCompletion?: (row: DailyRoutineDay, itemId: string, completed: boolean) => void;
  onRetryMutation: () => void;
  onOpenTrainingTarget: (programVersionId: string, stepId: string, activityId: string) => void;
};

const RING_SIZE = 220;
const RING_RADIUS = 100;
const RING_STROKE_WIDTH = 12;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_CIRCLE_CENTER = RING_SIZE / 2;

export function DailyProgressScreen({ dogName, dateKey, state, refreshing, refreshError, activities, mutationBusy, mutationKey,
  mutationMessage, mutationError, trainingTargetFeedback, onBack, onRetry, onSetRoutineCompletion, onRetryMutation, onOpenTrainingTarget }: Props) {
  const progress = summarizeDailyActivityProgress(activities);
  const progressLabel = dailyActivityProgressLabel(progress);
  const dateLabel = formatDateLabel(dateKey);
  const summaryTitle = refreshError ? 'Senast bekräftat' : progress.completedCount > 0 ? 'Bra jobbat!' : 'Dagens framsteg';
  const summaryBody = refreshError ? (progress.confirmedCount > 0 ? progressLabel + '. Uppdatera för aktuell status.' : 'Den senaste uppdateringen kunde inte bekräfta dagens status.')
    : progress.confirmedCount > 0 && progress.completedCount === progress.confirmedCount && progress.unavailableCount === 0
    ? 'Alla dagens valda uppgifter är klara.'
    : progress.confirmedCount > 0 ? 'Ni har gjort ' + progress.completedCount + ' av ' + progress.confirmedCount + ' bekräftade uppgifter idag.'
      : progress.unavailableCount > 0 ? 'Vi kunde inte bekräfta några uppgifter ännu.' : 'Välj dagens uppgifter på Hem för att följa framstegen här.';

  return <View style={styles.screen}>
    <AppBar mode="Back" variant="compact" title="Dagens framsteg" actionLabel="Tillbaka till Hem" onAction={onBack} />

    {refreshing && state === 'ready' ? <View style={styles.refreshing} accessibilityLiveRegion="polite">
      <ActivityIndicator size="small" color={tokens.colors.home.greenStrong} />
      <Text style={styles.muted}>Uppdaterar dagens framsteg…</Text>
    </View> : null}
    {refreshError && state === 'ready' ? <View style={styles.errorBanner} accessibilityLiveRegion="polite">
      <Text style={styles.errorCopy}>Uppdateringen kunde inte hämtas. Visar senast bekräftade uppgifter.</Text>
      <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta dagens framsteg igen" onPress={onRetry} />
    </View> : null}

    {state === 'loading' ? <Card variant="home" accessibilityLabel="Hämtar dagens framsteg">
      <Skeleton shape="line" lines={2} />
      <Skeleton shape="row" lines={3} />
    </Card> : null}
    {state === 'error' ? <View style={styles.errorBanner} accessibilityLiveRegion="polite">
      <Text style={styles.errorCopy}>Dagens framsteg kunde inte hämtas. Ingen status räknas just nu.</Text>
      <Button variant="tertiary" label="Hämta dagens framsteg igen" accessibilityLabel="Hämta dagens framsteg igen" onPress={onRetry} />
    </View> : null}
    {state === 'hidden' ? <MessageCard>Dagens framsteg är inte tillgängligt just nu.</MessageCard> : null}

    {state === 'ready' ? <>
      <View style={styles.summary}>
          <ProgressRing dogName={dogName} dateLabel={dateLabel} completed={progress.completedCount} confirmed={progress.confirmedCount}
            unavailable={progress.unavailableCount} stale={refreshError} />
          {refreshError && progress.confirmedCount > 0 ? <Text style={styles.muted}>Senast bekräftat: {progressLabel}</Text> : null}
          {progress.unavailableCount > 0 ? <Text style={styles.muted}>{progress.unavailableCount === 1
            ? '1 uppgift har en status som inte kunde bekräftas.'
            : progress.unavailableCount + ' uppgifter har statusar som inte kunde bekräftas.'}</Text> : null}
          {progress.confirmedCount === 0 && progress.unavailableCount === 0
            ? <Text style={styles.muted}>Inga uppgifter valda för idag.</Text> : null}
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Det här har ni gjort idag</Text>
      </View>
      {activities.length === 0 ? <Card variant="home" accessibilityLabel="Inga uppgifter valda idag">
        <Text style={styles.empty}>Inga uppgifter valda för idag.</Text>
      </Card> : <Card variant="home" accessibilityLabel="Dagens aktiviteter">
        <View style={styles.activityList}>
          {activities.map((item, index) => {
            const row = item.routineDay;
            const itemMutationKey = row && item.routineItemId ? `complete-routine:${row.id}:${item.routineItemId}` : '';
            const isMutation = Boolean(itemMutationKey && mutationKey === itemMutationKey);
            const isReadbackError = isMutation && mutationMessage.startsWith('Ändringen sparades, men dagens lista');
            const retry = isMutation ? (isReadbackError ? onRetry : onRetryMutation) : undefined;
            const targetMessage = item.kind === 'training' && trainingTargetFeedback?.activityId === item.id ? trainingTargetFeedback.message : '';
            return <View key={item.id} style={[styles.activityRow, index > 0 && styles.rowSeparator]}>
              {item.kind === 'training' ? <TrainingRow activity={item} pending={isMutation && mutationBusy}
                statusMessage={targetMessage || (isMutation ? mutationMessage : '')} statusError={Boolean(targetMessage) || (isMutation && mutationError)}
                onRetry={retry} onOpen={() => {
                  if (item.availability === 'available' && item.programId && item.stepId) onOpenTrainingTarget(item.programId, item.stepId, item.id);
                }} />
                : <RoutineRow activity={item} pending={isMutation && mutationBusy} statusMessage={isMutation ? mutationMessage : ''}
                  statusError={isMutation && mutationError} onToggle={row && item.routineItemId && !mutationBusy
                    ? () => onSetRoutineCompletion?.(row, item.routineItemId as string, !item.completed) : undefined}
                  onRetry={retry} />}
            </View>;
          })}
        </View>
      </Card>}
      <View accessibilityRole="summary" accessibilityLabel="Dagens sammanfattning" style={styles.warmSummarySurface}>
        <View style={styles.encouragement}>
          <Ionicons name={progress.completedCount > 0 ? 'star' : 'information-circle-outline'} size={tokens.size.iconMd}
            color={progress.completedCount > 0 ? tokens.colors.home.sun : tokens.colors.home.greenStrong} accessibilityElementsHidden />
          <View style={styles.encouragementCopy}>
            <Text style={styles.encouragementTitle}>{summaryTitle}</Text>
            <Text style={styles.warmSummary}>{summaryBody}</Text>
          </View>
        </View>
      </View>
    </> : null}
  </View>;
}

function ProgressRing({ dogName, dateLabel, completed, confirmed, unavailable, stale }: { dogName: string; dateLabel: string; completed: number; confirmed: number; unavailable: number; stale: boolean }) {
  const ratio = confirmed > 0 ? Math.max(0, Math.min(1, completed / confirmed)) : 0;
  const unknownArcDegrees = unavailable > 0 ? Math.min(24, Math.max(8, unavailable * 8)) : 0;
  const unknownGapDegrees = unavailable > 0 ? 1 : 0;
  const confirmedArcDegrees = 360 - unknownArcDegrees - unknownGapDegrees;
  const completedArcDegrees = stale ? 0 : ratio * confirmedArcDegrees;
  const completedArcLength = RING_CIRCUMFERENCE * completedArcDegrees / 360;
  const unknownArcLength = RING_CIRCUMFERENCE * unknownArcDegrees / 360;
  const unknownArcStartOffset = -RING_CIRCUMFERENCE * (confirmedArcDegrees + unknownGapDegrees) / 360;
  const hasAccessibleProgressValue = confirmed > 0 && unavailable === 0 && !stale;
  const label = confirmed > 0 ? `${completed} av ${confirmed} bekräftade uppgifter klara${unavailable > 0 ? `, ${unavailable} status kan inte bekräftas` : ''}`
    : unavailable > 0 ? 'Inga uppgifter med bekräftad status' : 'Inga uppgifter valda';
  return <View testID="daily-progress-ring" style={styles.ring} accessibilityRole={hasAccessibleProgressValue ? 'progressbar' : undefined}
    accessibilityLabel={hasAccessibleProgressValue ? dogName + ', ' + dateLabel + ': ' + label : undefined} accessibilityValue={hasAccessibleProgressValue ? { min: 0, max: confirmed, now: completed } : undefined}>
    <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg} accessible={false} accessibilityElementsHidden importantForAccessibility="no">
      <Circle cx={RING_CIRCLE_CENTER} cy={RING_CIRCLE_CENTER} r={RING_RADIUS} fill="none" stroke={tokens.colors.home.progressTrack} strokeWidth={RING_STROKE_WIDTH} />
      {completedArcLength > 0 ? <Circle cx={RING_CIRCLE_CENTER} cy={RING_CIRCLE_CENTER} r={RING_RADIUS} fill="none"
        stroke={tokens.colors.home.greenFill} strokeWidth={RING_STROKE_WIDTH} strokeLinecap="butt"
        strokeDasharray={completedArcDegrees >= 360 ? undefined : [completedArcLength, RING_CIRCUMFERENCE - completedArcLength]}
        rotation={-90} originX={RING_CIRCLE_CENTER} originY={RING_CIRCLE_CENTER} /> : null}
      {unknownArcLength > 0 ? <Circle cx={RING_CIRCLE_CENTER} cy={RING_CIRCLE_CENTER} r={RING_RADIUS} fill="none"
        stroke={tokens.colors.home.sun} strokeWidth={RING_STROKE_WIDTH} strokeLinecap="butt"
        strokeDasharray={[unknownArcLength, RING_CIRCUMFERENCE - unknownArcLength]} strokeDashoffset={unknownArcStartOffset}
        rotation={-90} originX={RING_CIRCLE_CENTER} originY={RING_CIRCLE_CENTER} /> : null}
    </Svg>
    <View style={styles.ringCenter}>
      <Image source={require('../../../assets/images/home-dog-portrait-placeholder.png')} style={styles.portrait} resizeMode="cover"
        accessible={false} accessibilityElementsHidden importantForAccessibility="no" />
      <Text style={styles.ringCount} accessibilityElementsHidden>{stale ? '—' : confirmed > 0 ? completed + ' av ' + confirmed : '—'}</Text>
      <Text style={styles.ringLabel} accessibilityElementsHidden>{stale ? 'uppdatering behövs' : confirmed > 0 ? unavailable > 0 ? 'bekräftade klara' : 'klara idag' : unavailable > 0 ? 'status saknas' : 'inga uppgifter'}</Text>
    </View>
  </View>;
}

function RoutineRow({ activity, pending, statusMessage, statusError, onToggle, onRetry }: {
  activity: HomeDailyActivity; pending: boolean; statusMessage: string; statusError: boolean; onToggle?: () => void; onRetry?: () => void;
}) {
  const category = routineIconCategory(activity.label);
  return <View style={styles.rowContent}>
    <MotionPressable accessibilityRole="checkbox" accessibilityLabel={`Rutin ${activity.routineLabel ?? ''}, punkt ${activity.label}, ${activity.completed ? 'klar' : 'inte klar'}`}
      accessibilityState={{ checked: activity.completed, disabled: !onToggle || pending }} disabled={!onToggle || pending} onPress={onToggle}
      style={({ pressed }) => [styles.checkboxTap, pressed && onToggle && styles.pressed]}>
      <View style={[styles.checkbox, activity.completed && styles.checkboxDone]}>
        {activity.completed ? <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.onPrimary} accessibilityElementsHidden /> : null}
      </View>
    </MotionPressable>
    {category ? <IconChip category={category} size="medium" /> : <View style={styles.neutralIcon}>
      <Ionicons name="checkbox-outline" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden />
    </View>}
    <View style={styles.rowCopy}>
      <Text style={styles.rowTitle}>{activity.label}</Text>
      <Text style={styles.rowDetail}>{activity.routineLabel ?? 'Egen rutin'}</Text>
      {statusMessage ? <Text accessibilityRole={statusError ? 'alert' : undefined} style={[styles.status, statusError && styles.errorCopy]}>{pending ? 'Sparar…' : statusMessage}</Text> : null}
      {statusMessage && onRetry ? <Button variant="tertiary" label="Kontrollera ändringen igen" accessibilityLabel={`Kontrollera ändringen för ${activity.label} igen`} disabled={pending} onPress={onRetry} /> : null}
    </View>
  </View>;
}

function TrainingRow({ activity, pending, statusMessage, statusError, onRetry, onOpen }: {
  activity: HomeDailyActivity; pending: boolean; statusMessage: string; statusError: boolean; onRetry?: () => void; onOpen: () => void;
}) {
  const available = activity.availability === 'available' && Boolean(activity.programId && activity.stepId);
  const time = activity.completedAt ? formatActivityTime(activity.completedAt, activity.trainingSelection?.time_zone) : '';
  const detail = activity.availability === 'adult-restricted' ? 'Inte tillgängligt för vuxna ännu'
    : activity.availability === 'unavailable' ? 'Status kan inte bekräftas · källan kunde inte hämtas'
      : [activity.programTitle, time].filter(Boolean).join(' · ') || 'Träning';
  const content = <>
    <View testID="daily-progress-training-status" style={[styles.trainingStatus, activity.completed && styles.trainingStatusDone]} accessibilityElementsHidden>
      {activity.completed ? <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.onPrimary} /> : null}
    </View>
    <IconChip category="training" size="medium" />
    <View style={styles.rowCopy}>
      <Text style={styles.rowTitle}>{activity.label}</Text>
      <Text style={styles.rowDetail}>{detail}</Text>
      {activity.availability === 'unavailable' ? <Text style={styles.status}>Status kan inte bekräftas</Text> : null}
      {statusMessage ? <Text accessibilityRole={statusError ? 'alert' : undefined} style={[styles.status, statusError && styles.errorCopy]}>{pending ? 'Sparar…' : statusMessage}</Text> : null}
    </View>
    {available ? <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden /> : null}
  </>;
  return <View>
    {available ? <MotionPressable accessibilityRole="button" accessibilityLabel={`Träningsuppgift: ${activity.label}, ${activity.completed ? 'klar' : 'inte klar'}, öppna Träning`}
      onPress={onOpen} style={({ pressed }) => [styles.rowContent, pressed && styles.pressed]}>{content}</MotionPressable>
      : <View accessibilityRole="text" style={styles.rowContent}>{content}</View>}
    {statusMessage && onRetry ? <Button variant="tertiary" label="Kontrollera ändringen igen" accessibilityLabel={`Kontrollera ändringen för ${activity.label} igen`} disabled={pending} onPress={onRetry} /> : null}
  </View>;
}

function formatDateLabel(dateKey: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey;
  const [year, month, day] = dateKey.split('-').map(Number);
  const instant = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(instant);
}

function formatActivityTime(value: string, timeZone?: string): string {
  if (!timeZone || !Number.isFinite(Date.parse(value))) return '';
  try { return new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit', timeZone }).format(new Date(value)); }
  catch { return ''; }
}

const styles = StyleSheet.create({
  screen: { gap: tokens.spacing.md },
  refreshing: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.sm },
  errorBanner: { gap: tokens.spacing.xs, padding: tokens.spacing.md, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.dangerSurface },
  errorCopy: { color: tokens.colors.danger },
  summary: { alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.sm },
  ring: { width: RING_SIZE, height: RING_SIZE, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  ringSvg: { position: 'absolute', left: 0, top: 0 },
  ringCenter: { position: 'absolute', width: 172, alignItems: 'center', gap: 2 },
  portrait: { width: 96, height: 96, borderRadius: tokens.radius.full },
  ringCount: { ...tokens.typography.heading, color: tokens.colors.home.text, textAlign: 'center' },
  ringLabel: { ...tokens.typography.caption, color: tokens.colors.home.textMuted, textAlign: 'center' },
  warmSummarySurface: { alignSelf: 'stretch', padding: tokens.layout.cardPadding, borderWidth: tokens.size.stroke, borderColor: tokens.colors.warningSurface,
    borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.warningSurface },
  encouragement: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  encouragementCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs / 2 },
  encouragementTitle: { ...tokens.typography.label, color: tokens.colors.home.text },
  warmSummary: { ...tokens.typography.body, color: tokens.colors.home.text, textAlign: 'left' },
  muted: { ...tokens.typography.caption, color: tokens.colors.home.textMuted, textAlign: 'center' },
  sectionHeading: { alignItems: 'center', gap: tokens.spacing.xs },
  sectionTitle: { ...tokens.typography.label, color: tokens.colors.home.text },
  activityList: { gap: 0 },
  activityRow: { paddingVertical: tokens.spacing.xs },
  rowSeparator: { borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  rowContent: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  checkboxTap: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full, marginHorizontal: tokens.spacing.xs },
  checkbox: { width: tokens.size.homeCheckbox, height: tokens.size.homeCheckbox, borderWidth: 2, borderColor: tokens.colors.home.textMuted, borderRadius: tokens.radius.sm,
    alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.card },
  checkboxDone: { borderColor: tokens.colors.home.greenStrong, backgroundColor: tokens.colors.home.greenStrong },
  trainingStatus: { width: tokens.size.homeCheckbox, height: tokens.size.homeCheckbox, borderWidth: 2, borderColor: tokens.colors.home.textMuted,
    borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', marginHorizontal: tokens.spacing.sm },
  trainingStatusDone: { borderColor: tokens.colors.home.greenStrong, backgroundColor: tokens.colors.home.greenStrong },
  neutralIcon: { width: tokens.size.chipMd, height: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.home.canvas },
  rowCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs / 2 },
  rowTitle: { ...tokens.typography.caption, color: tokens.colors.home.text, fontWeight: '600', flexShrink: 1 },
  rowDetail: { ...tokens.typography.caption, color: tokens.colors.home.textMuted, flexShrink: 1 },
  status: { ...tokens.typography.caption, color: tokens.colors.home.textMuted, flexShrink: 1 },
  empty: { ...tokens.typography.body, color: tokens.colors.home.textMuted, textAlign: 'center', paddingVertical: tokens.spacing.sm },
  pressed: { backgroundColor: tokens.colors.selectedSurface },
});
