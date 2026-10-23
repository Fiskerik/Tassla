import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { AppBar, Button, Card, DailyActivityItem, Skeleton } from '../../components/ui';
import { MessageCard } from '../../components/AppPrimitives';
import type { DailyRoutineDay } from './daily-activity-data';
import { dailyProgressRingFill, selectDailyProgress, type DailyProgressSourceState, type HomeDailyActivity } from './daily-activity-model';
import { checklistDateLabel } from './DailyChecklistScreen';
import { tokens } from '../../theme/tokens';

export function DailyProgressScreen({ dogName, dateKey, state, activities, refreshing = false, refreshError = false,
  mutationBusy = false, mutationKey = '', mutationMessage = '', mutationError = false,
  onBack, onRetry, onRetryMutation, onManage, onOpenChecklist, onOpenTrainingStep, onSetRoutineCompletion }: {
  dogName: string;
  dateKey: string;
  state: DailyProgressSourceState;
  activities: readonly HomeDailyActivity[];
  refreshing?: boolean;
  refreshError?: boolean;
  mutationBusy?: boolean;
  mutationKey?: string;
  mutationMessage?: string;
  mutationError?: boolean;
  onBack: () => void;
  onRetry: () => void;
  onRetryMutation?: () => void;
  onManage: () => void;
  onOpenChecklist: () => void;
  onOpenTrainingStep: (programId: string, stepId: string) => void;
  onSetRoutineCompletion: (row: DailyRoutineDay, itemId: string, completed: boolean) => void;
}) {
  const progress = selectDailyProgress(activities, state);
  const readyWithActivities = progress.coverage === 'complete';

  return <View style={styles.page} testID="daily-progress-screen">
    <AppBar mode="Back" title="Dagens framsteg" actionLabel="Tillbaka till Hem" onAction={onBack} variant="compact" />
    <Text style={styles.dateHeading}>{checklistDateLabel(dateKey)}</Text>
    {refreshError && state === 'ready' ? <MessageCard>Uppdateringen kunde inte hämtas. Du ser senast hämtade aktiviteter.</MessageCard> : null}
    {refreshing ? <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel="Dagens framsteg uppdateras" size="small" color={tokens.colors.home.greenStrong} /> : null}

    {readyWithActivities ? <>
      <View style={styles.heroCard}>
        <ProgressRing completed={progress.completedCount} total={progress.totalCount} dogName={dogName} />
      </View>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Dagens aktiviteter</Text>
        <Text style={styles.sectionCount}>{progress.completedCount} av {progress.totalCount} klara</Text>
      </View>
      <Card variant="home">
        <View style={styles.activityList}>
          {progress.activities.map((item) => {
            const routineDay = item.routineDay;
            const itemMutationKey = routineDay && item.routineItemId ? `complete-routine:${routineDay.id}:${item.routineItemId}` : '';
            const itemMutation = Boolean(itemMutationKey && mutationKey === itemMutationKey);
            const readbackError = itemMutation && mutationMessage.startsWith('Ändringen sparades, men dagens lista');
            return <DailyActivityItem key={item.id} variant="home" kind={item.kind} label={item.label} routineLabel={item.routineLabel}
              accessibilityLabel={item.kind === 'routine' ? `Rutin ${item.routineLabel ?? ''}, punkt ${item.label}` : `Träningsuppgift: ${item.label}`}
              completed={item.completed} pending={itemMutation && mutationBusy}
              statusMessage={itemMutation ? mutationMessage : ''} statusError={itemMutation && mutationError}
              onToggle={routineDay && item.routineItemId ? () => onSetRoutineCompletion(routineDay, item.routineItemId!, !item.completed) : undefined}
              onOpen={item.kind === 'training' && item.programId && item.stepId
                ? () => onOpenTrainingStep(item.programId!, item.stepId!)
                : onOpenChecklist}
              onRetry={itemMutation ? (onRetryMutation ?? (readbackError ? onRetry : undefined)) : undefined} />;
          })}
        </View>
      </Card>
      {progress.completedCount === progress.totalCount ? <View testID="daily-progress-complete-note" style={styles.completeNote}>
        <View style={styles.completeNoteIcon}><Ionicons name="sparkles-outline" size={tokens.size.iconMd} color={tokens.colors.warning} accessibilityElementsHidden /></View>
        <View style={styles.completeNoteCopy}>
          <Text style={styles.completeNoteTitle} accessibilityRole="header">Dagens lista är klar</Text>
          <Text style={styles.completeNoteText}>{progress.totalCount} {progress.totalCount === 1 ? 'aktivitet markerad' : 'aktiviteter markerade'} som klara idag.</Text>
        </View>
      </View> : null}
      <Button variant="tertiary" label="Öppna Checklistor" accessibilityLabel="Öppna hela dagens checklista" onPress={onOpenChecklist} />
    </> : null}

    {progress.coverage === 'loading' ? <View style={styles.loadingState}>
      <View style={styles.loadingImage}><Image source={require('../../../assets/images/daily-progress-hero-puppy-terrier.jpg')} style={styles.loadingImagePhoto} resizeMode="cover" accessibilityElementsHidden />
        <Text style={styles.imageBadge}>Standardbild</Text>
      </View>
      <Skeleton shape="card" lines={3} />
      <Skeleton shape="row" lines={3} />
    </View> : null}

    {progress.coverage === 'error' ? <View style={styles.stateCard}>
      <MessageCard tone="error">Dagens framsteg kunde inte hämtas. Inget antal visas förrän aktiviteterna har lästs in.</MessageCard>
      <Button label="Försök igen" accessibilityLabel="Hämta dagens framsteg igen" onPress={onRetry} />
    </View> : null}

    {progress.coverage === 'unknown' || progress.coverage === 'partial' ? <View style={styles.stateCard}>
      <MessageCard>{progress.coverage === 'partial' ? 'Dagens sammanställning är inte komplett ännu. Inget antal visas.' : 'Dagens aktiviteter är inte tillgängliga ännu. Inget antal visas.'}</MessageCard>
      <Button variant="tertiary" label="Uppdatera" accessibilityLabel="Uppdatera dagens aktiviteter" onPress={onRetry} />
    </View> : null}

    {progress.coverage === 'empty' ? <View style={styles.emptyState}>
      <View style={styles.emptyPhoto}>
        <Image source={require('../../../assets/images/daily-progress-hero-puppy-terrier.jpg')} style={styles.emptyPhotoImage} resizeMode="cover"
          accessible accessibilityLabel="Standardbild: strävhårig hund i varm hemmiljö" />
        <Text style={styles.imageBadge}>Standardbild</Text>
      </View>
      <View style={styles.emptyCopy}>
        <Text style={styles.emptyTitle} accessibilityRole="header">Inga aktiviteter idag</Text>
        <Text style={styles.emptyBody}>Välj en rutin eller ett träningssteg för att börja följa dagens framsteg.</Text>
      </View>
      <Button label="Hantera dagens aktiviteter" accessibilityLabel="Hantera dagens aktiviteter" onPress={onManage} />
    </View> : null}
  </View>;
}

function ProgressRing({ completed, total, dogName }: { completed: number; total: number; dogName: string }) {
  const diameter = tokens.size.homeProgressRingDiameter;
  const stroke = tokens.size.homeProgressRingStroke;
  const radius = (diameter - stroke) / 2;
  const center = diameter / 2;
  const circumference = Math.PI * 2 * radius;
  const fill = dailyProgressRingFill(completed, total);
  return <View accessibilityRole="progressbar" accessibilityLabel={`${completed} av ${total} dagsuppgifter klara`}
    accessibilityValue={{ min: 0, max: total, now: completed }} style={[styles.ring, { width: diameter, height: diameter }]}>
    <Svg accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`} style={styles.ringSvg}>
      <Defs>
        <LinearGradient id="daily-progress-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={tokens.colors.home.greenStrong} />
          <Stop offset="100%" stopColor={tokens.colors.home.greenFill} />
        </LinearGradient>
      </Defs>
      <Circle cx={center} cy={center} r={radius} fill="none" stroke={tokens.colors.home.progressTrack} strokeWidth={stroke} />
      {fill.fraction > 0 ? <Circle testID="daily-progress-ring-progress" accessible={false} cx={center} cy={center} r={radius}
        fill="none" stroke="url(#daily-progress-ring-gradient)" strokeWidth={stroke}
        strokeDasharray={`${circumference * fill.fraction} ${circumference}`} strokeDashoffset={0}
        strokeLinecap={fill.fraction === 1 ? 'butt' : 'round'} transform={`rotate(-90 ${center} ${center})`} /> : null}
    </Svg>
    <View accessible={false} style={[styles.ringContent, { width: diameter, height: diameter }]}>
      <View style={styles.ringPortrait}>
        <Image source={require('../../../assets/images/daily-progress-hero-puppy-terrier.jpg')} style={styles.ringPhoto} resizeMode="cover" accessible={false} accessibilityElementsHidden importantForAccessibility="no" />
        <Text style={styles.ringPhotoBadge}>Standardbild</Text>
      </View>
      <Text style={styles.ringCount}>{completed} av {total}</Text>
      <Text style={styles.ringCaption}>klara idag med {dogName}</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  page: { gap: tokens.spacing.md, paddingBottom: tokens.spacing.xl, marginHorizontal: -tokens.layout.pageInset, paddingHorizontal: tokens.layout.pageInset, backgroundColor: tokens.colors.home.canvas },
  dateHeading: { ...tokens.typography.caption, color: tokens.colors.home.textMuted, textAlign: 'center', textTransform: 'capitalize' },
  heroCard: { minHeight: tokens.size.homeProgressRingDiameter + tokens.spacing.md, alignItems: 'center', justifyContent: 'center', paddingVertical: tokens.spacing.xs },
  ring: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringSvg: { position: 'absolute' },
  ringContent: { position: 'absolute', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs / 2 },
  ringPortrait: { position: 'relative', width: tokens.size.homeProgressRingDiameter * 0.45, height: tokens.size.homeProgressRingDiameter * 0.45, marginBottom: tokens.spacing.xs / 2 },
  ringPhoto: { width: '100%', height: '100%', borderRadius: tokens.radius.full },
  ringPhotoBadge: { position: 'absolute', top: tokens.spacing.xs, right: -tokens.spacing.xs, paddingHorizontal: tokens.spacing.xs, paddingVertical: 2, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.home.card, ...tokens.typography.smallCaption, fontWeight: '700', color: tokens.colors.home.text },
  ringCount: { ...tokens.typography.heading, color: tokens.colors.home.text },
  ringCaption: { ...tokens.typography.smallCaption, color: tokens.colors.home.textMuted },
  sectionHeading: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  sectionTitle: { ...tokens.typography.label, color: tokens.colors.home.text, flex: 1 },
  sectionCount: { ...tokens.typography.caption, color: tokens.colors.home.textMuted },
  activityList: { gap: 0 },
  completeNote: { minHeight: tokens.size.touchMin + tokens.spacing.md, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.md, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.warningSurface },
  completeNoteIcon: { width: tokens.size.chipLg, height: tokens.size.chipLg, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.md, backgroundColor: tokens.colors.home.card },
  completeNoteCopy: { flex: 1, gap: tokens.spacing.xs / 2 },
  completeNoteTitle: { ...tokens.typography.label, color: tokens.colors.home.text },
  completeNoteText: { ...tokens.typography.caption, color: tokens.colors.warning },
  loadingState: { gap: tokens.spacing.md },
  loadingImage: { height: tokens.size.developmentHeroHeight * 0.62, borderRadius: tokens.radius.lg, overflow: 'hidden' },
  loadingImagePhoto: { width: '100%', height: '100%' },
  stateCard: { gap: tokens.spacing.sm },
  emptyState: { gap: tokens.spacing.md, padding: tokens.spacing.md, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.home.card },
  emptyPhoto: { position: 'relative', height: tokens.size.developmentHeroHeight * 0.72, borderRadius: tokens.radius.md, overflow: 'hidden' },
  emptyPhotoImage: { width: '100%', height: '100%' },
  imageBadge: { position: 'absolute', top: tokens.spacing.sm, right: tokens.spacing.sm, overflow: 'hidden', paddingHorizontal: tokens.spacing.sm, paddingVertical: tokens.spacing.xs, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.home.card, ...tokens.typography.smallCaption, fontWeight: '700', color: tokens.colors.home.text },
  emptyCopy: { gap: tokens.spacing.xs },
  emptyTitle: { ...tokens.typography.heading, color: tokens.colors.home.text },
  emptyBody: { ...tokens.typography.caption, color: tokens.colors.home.textMuted },
});
