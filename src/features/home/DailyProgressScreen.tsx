import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { AppBar, Button, Card, DailyActivityItem, Skeleton } from '../../components/ui';
import { MessageCard } from '../../components/AppPrimitives';
import type { DailyRoutineDay } from './daily-activity-data';
import { selectDailyProgress, type DailyProgressSourceState, type HomeDailyActivity } from './daily-activity-model';
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
  const fraction = Math.max(0, Math.min(1, completed / total));
  const revealY = diameter / 2 * (1 - Math.cos(fraction * Math.PI * 2));
  const endAngle = fraction * Math.PI * 2 - Math.PI / 2;
  const capX = diameter / 2 + radius * Math.cos(endAngle);
  const capY = diameter / 2 + radius * Math.sin(endAngle);
  return <View accessibilityRole="progressbar" accessibilityLabel={`${completed} av ${total} dagsuppgifter klara`}
    accessibilityValue={{ min: 0, max: total, now: completed }} style={[styles.ring, { width: diameter, height: diameter }]}>
    <View accessible={false} style={[styles.ringTrack, { width: diameter, height: diameter, borderRadius: diameter / 2, borderWidth: stroke }]} />
    {fraction > 0 ? <View accessible={false} style={[styles.ringHalfClip, { left: diameter / 2, width: diameter / 2, height: fraction <= 0.5 ? revealY : diameter }]}>
      <View style={[styles.ringOutline, { width: diameter, height: diameter, left: -diameter / 2, borderRadius: diameter / 2, borderWidth: stroke }]} />
    </View> : null}
    {fraction > 0.5 ? <View accessible={false} style={[styles.ringHalfClip, { left: 0, top: revealY, width: diameter / 2, height: diameter - revealY }]}>
      <View style={[styles.ringOutline, { width: diameter, height: diameter, left: 0, top: -revealY, borderRadius: diameter / 2, borderWidth: stroke }]} />
    </View> : null}
    <View accessible={false} style={[styles.ringMask, { width: diameter - stroke * 2, height: diameter - stroke * 2, left: stroke, top: stroke, borderRadius: diameter / 2 }]} />
    {fraction > 0 && fraction < 1 ? <View accessible={false} style={[styles.ringCap, { width: stroke, height: stroke, left: capX - stroke / 2, top: capY - stroke / 2, borderRadius: stroke / 2 }]} /> : null}
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
  heroCard: { minHeight: tokens.size.homeProgressRingDiameter + tokens.spacing.lg, alignItems: 'center', justifyContent: 'center', paddingVertical: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.home.card },
  ring: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringTrack: { position: 'absolute', borderColor: tokens.colors.home.progressTrack },
  ringHalfClip: { position: 'absolute', top: 0, overflow: 'hidden' },
  ringOutline: { position: 'absolute', borderColor: tokens.colors.home.greenFill, backgroundColor: 'transparent' },
  ringCap: { position: 'absolute', backgroundColor: tokens.colors.home.greenFill },
  ringMask: { position: 'absolute', backgroundColor: tokens.colors.home.card },
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
