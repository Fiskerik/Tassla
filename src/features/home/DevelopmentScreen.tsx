import { EditorialImage as Image } from '../../components/ui/EditorialImage';
import { useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppBar, Button, Skeleton } from '../../components/ui';
import { MessageCard } from '../../components/AppPrimitives';
import { MotionPressable } from '../../components/ui/Motion';
import { ThemedIcon } from '../../components/ui/ThemedIcon';
import type { HomeContent } from '../../data/app-data';
import { tokens } from '../../theme/tokens';
import { automaticDogAge } from '../onboarding/dog';
import { homeAgeInWeeks } from './home-today';
import { developmentPhase } from './development-content';
import { ContentSources } from '../knowledge/ContentSources';
import type { ChecklistContext, ChecklistTemplate } from '../knowledge/checklist-model';
import { developmentTitle } from './development-title';

type GuideState = 'loading' | 'ready' | 'error';

export function DevelopmentScreen({ dogName, birthDate, today, guides, guidesState, phaseTemplates = [], phaseState = 'loading', onRetryPhases, onBack, onOpenGuide, onRetryGuides }: {
  dogName: string;
  birthDate: string | null;
  today: string;
  guides: readonly HomeContent[];
  guidesState: GuideState;
  phaseTemplates?: readonly ChecklistTemplate[];
  phaseState?: GuideState;
  onRetryPhases?: () => void;
  onBack: () => void;
  onOpenGuide: (contentId: string) => void;
  onRetryGuides: () => void;
}) {
  const age = useMemo(() => automaticDogAge(birthDate, today), [birthDate, today]);
  const ageProgress = useMemo(() => age && age.stage !== 'VUXEN' ? progressToAdultStage(birthDate, today) : null, [age, birthDate, today]);
  const phaseLabel = age ? formatStage(age.stage) : null;
  const [context, setContext] = useState<ChecklistContext>('by_age');
  const [ageLabelVisible, setAgeLabelVisible] = useState(true);
  const [heroWidth, setHeroWidth] = useState(0);
  const [bubbleWidth, setBubbleWidth] = useState<number>(tokens.size.developmentAgeMarkerWidth);
  const ageWeeks = homeAgeInWeeks(birthDate, today);
  const phase = developmentPhase(phaseTemplates, ageWeeks, context);

  return <View style={styles.page} testID="development-screen">
    <View style={styles.heroSection}>
      <AppBar mode="Back" title={developmentTitle(dogName)} actionLabel="Tillbaka till Hem" onAction={onBack} variant="compact" titleVariant="screen" />

      <View style={styles.hero} testID="development-hero" onLayout={(event) => setHeroWidth(event.nativeEvent.layout.width)}>
        <Image source={require('../../../assets/images/development-hero-puppy-black-tan-forest-wide.jpg')} style={styles.heroImage} resizeMode="cover"
          accessible={false} accessibilityElementsHidden importantForAccessibility="no" />
        {ageProgress !== null && age && age.stage !== 'VUXEN' && ageLabelVisible ? <MotionPressable
          testID="development-age-pill" accessibilityRole="button"
          accessibilityLabel={`Dölj åldersmarkeringen ${age.label}. Fas ${formatStage(age.stage)}.`}
          accessibilityHint="Döljer åldersetiketten. Tryck sedan på markören för att visa den igen."
          onLayout={(event) => setBubbleWidth(event.nativeEvent.layout.width)}
          onPress={() => setAgeLabelVisible(false)}
          style={[styles.ageBubbleTouch, { left: Math.max(0, Math.min(Math.max(0, heroWidth - bubbleWidth),
            tokens.spacing.md + tokens.size.touchMin / 2 + Math.max(0, heroWidth - 2 * tokens.spacing.md - tokens.size.touchMin) * ageProgress - bubbleWidth / 2)) }]}>
          <View style={styles.ageBubble}><Text style={styles.ageBubbleText}>{age.label}</Text></View>
        </MotionPressable> : null}
      </View>
      <View style={styles.ageJourney} testID="development-age-journey">
        {ageProgress !== null && age && age.stage !== 'VUXEN' ? <AgeTimeline progress={ageProgress} currentAge={age.label} stage={age.stage} ageLabelVisible={ageLabelVisible} onShowAge={() => setAgeLabelVisible(true)} />
          : age?.stage === 'VUXEN' ? <View style={styles.matureAge}>
          <Text style={styles.matureAgeLabel}>KRONOLOGISK ÅLDER</Text>
          <Text style={styles.matureAgeValue}>{age.label}</Text>
          <View style={styles.phasePill}><View style={styles.phaseDot} /><Text style={styles.phaseText}>Vuxen</Text></View>
        </View> : <View style={styles.unknownAge}>
          <Ionicons name="calendar-outline" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden />
          <Text style={styles.unknownAgeText}>Åldersresan visas när ett giltigt födelsedatum finns.</Text>
        </View>}
      </View>
    </View>

    <View style={styles.currentStage}>
      <View style={styles.currentStageIcon}><Ionicons name="bulb" size={tokens.size.iconMd} color={tokens.colors.home.bulb} accessibilityElementsHidden /></View>
      <View style={styles.currentStageCopy}>
        <Text style={styles.currentStageEyebrow}>DU ÄR HÄR</Text>
        <Text style={styles.currentStageTitle}>{age ? `${age.label} · ${phaseLabel}` : 'Ålder och fas'}</Text>
        <Text style={styles.currentStageBody}>Ungefärlig kalenderålder, inte färdighet.</Text>
      </View>
    </View>

    <View style={styles.phaseCard} testID="development-phase-suggestions">
      <Text style={styles.sectionTitle} accessibilityRole="header">Förslag för fasen</Text>
      <Text style={styles.phaseCaption}>Välj det som passar er. Hundar utvecklas olika.</Text>
      <View accessibilityRole="tablist" accessibilityLabel="Välj sammanhang" style={styles.contextChoices}>
        {([['by_age', 'Utifrån ålder'], ['before_homecoming', 'Före hemkomst'], ['first_days', 'Första dagarna']] as const).map(([value, label]) =>
          <MotionPressable key={value} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: context === value }}
            aria-selected={context === value}
            onPress={() => setContext(value)} style={[styles.contextChoice, context === value && styles.contextSelected]}>
            <Text style={[styles.contextText, context === value && styles.contextTextSelected]}>{label}</Text>
          </MotionPressable>)}
      </View>
      {phaseState === 'loading' ? <Skeleton shape="row" lines={2} /> : null}
      {phaseState === 'error' ? <View style={styles.guideState}>
        <MessageCard tone="error">Förslagen kunde inte hämtas.</MessageCard>
        <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta fasförslag igen" onPress={onRetryPhases ?? (() => undefined)} />
      </View> : null}
      {phaseState === 'ready' && phase ? <>
        <Text style={styles.phaseTitle}>{phase.title}</Text>
        <Text style={styles.phaseCaption}>AI-genererat innehåll</Text>
        {phase.items.map((item, index) => <View key={item.key} testID={`development-phase-item-${item.key}`}>
          {index > 0 ? <View style={styles.phaseDivider} /> : null}
          <View style={styles.phaseRow}>
            <ThemedIcon name="sparkles-outline" tone="training" size="medium" />
            <Text style={styles.phaseItem}>{item.title}</Text>
          </View>
        </View>)}
        <ContentSources sources={phase.sources ?? []} onOpenSource={(url) => {
          void Linking.openURL(url).catch(() => Alert.alert('Källan kunde inte öppnas', 'Försök igen när anslutningen fungerar.'));
        }} />
      </> : null}
      {phaseState === 'ready' && !phase ? <Text style={styles.phaseEmpty}>
        {context === 'by_age' && (ageWeeks === null || ageWeeks < 8)
          ? 'Välj sammanhang för att se förslag.' : 'Det finns inga publicerade förslag för valet just nu.'}
      </Text> : null}
    </View>

    <View style={styles.guideSection}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Rekommenderad läsning</Text>
        {guides.length > 0 && guidesState === 'ready' ? <Text style={styles.guideCount}>{guides.length}</Text> : null}
      </View>
      {guidesState === 'loading' ? <View style={styles.loadingGuides}>
        <Skeleton shape="row" lines={2} />
        <Skeleton shape="row" lines={2} />
      </View> : null}
      {guidesState === 'error' ? <View style={styles.guideState}>
        <MessageCard tone="error">Rekommendationerna kunde inte hämtas just nu.</MessageCard>
        <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta rekommenderad läsning igen" onPress={onRetryGuides} />
      </View> : null}
      {guidesState === 'ready' && guides.length === 0 ? <MessageCard>Det finns ingen rekommenderad läsning just nu.</MessageCard> : null}
      {guidesState === 'ready' ? guides.map((guide) => <GuideRow key={guide.id} guide={guide} onPress={() => onOpenGuide(guide.id)} />) : null}
    </View>
  </View>;
}

function AgeTimeline({ progress, currentAge, stage, ageLabelVisible, onShowAge }: { progress: number; currentAge: string; stage: 'VALP' | 'UNGHUND'; ageLabelVisible: boolean; onShowAge: () => void }) {
  const [width, setWidth] = useState(0);
  const hitSize = tokens.size.touchMin;
  const markerSize = tokens.size.developmentAgeMarkerDiameter;
  const trackWidth = Math.max(0, width - hitSize);
  const markerX = hitSize / 2 + trackWidth * progress;
  const phaseName = formatStage(stage);
  return <View style={styles.timelineBlock} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
    <View testID="development-age-timeline" style={styles.timelineTrackArea}>
      <View testID="development-age-timeline-track" style={styles.timelineTrack}>
        <View testID="development-age-progress" style={[styles.timelineProgress, { width: `${progress * 100}%` }]} />
      </View>
      {ageLabelVisible ? <View testID="development-age-marker" accessible={false} style={[styles.timelineMarker, { left: markerX - markerSize / 2 }]} />
        : <MotionPressable testID="development-age-marker-toggle" accessibilityRole="button"
          accessibilityLabel={`Visa åldersmarkeringen ${currentAge}. Fas ${phaseName}.`}
          onPress={onShowAge} style={[styles.markerToggle, { left: markerX - hitSize / 2 }]}>
          <View style={styles.markerToggleDot} />
        </MotionPressable>}
    </View>
    <View style={styles.phaseLegend}>
      <View style={styles.phaseLegendGroup}><View style={[styles.phaseLegendDot, styles.puppyLegendDot]} /><Text style={styles.phaseLegendText}>Valp</Text><Text style={styles.phaseRange}>0–6 mån</Text></View>
      <View style={styles.phaseLegendGroup}><View style={[styles.phaseLegendDot, styles.adolescentLegendDot]} /><Text style={styles.phaseLegendText}>Unghund</Text><Text style={styles.phaseRange}>6–24 mån</Text></View>
    </View>
  </View>;
}

function GuideRow({ guide, onPress }: { guide: HomeContent; onPress: () => void }) {
  return <MotionPressable accessibilityRole="button" accessibilityLabel={`Öppna: ${guide.title}`}
    onPress={onPress} style={({ pressed }) => [styles.guideRow, pressed && styles.guidePressed]}>
    <View style={styles.bookIcon}><Ionicons name="book-outline" size={tokens.size.iconMd} color={tokens.colors.destination.knowledge.icon} accessibilityElementsHidden /></View>
    <View style={styles.guideCopy}>
      <Text style={styles.guideTitle} numberOfLines={2}>{guide.title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.home.textMuted} accessibilityElementsHidden />
  </MotionPressable>;
}

function progressToAdultStage(birthDate: string | null, today: string): number | null {
  const birth = parseCalendarDate(birthDate);
  const current = parseCalendarDate(today);
  if (!birth || !current || current < birth) return null;
  const endpoint = addCalendarMonths(birth, 24);
  if (current >= endpoint) return null;
  const fraction = (current.getTime() - birth.getTime()) / (endpoint.getTime() - birth.getTime());
  return Math.max(0, Math.min(1, fraction));
}

function parseCalendarDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day ? parsed : null;
}

function addCalendarMonths(date: Date, months: number): Date {
  const targetMonth = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(targetMonth / 12);
  const month = targetMonth % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
}

function formatStage(stage: 'VALP' | 'UNGHUND' | 'VUXEN'): string {
  return stage === 'VALP' ? 'Valp' : stage === 'UNGHUND' ? 'Unghund' : 'Vuxen';
}

const styles = StyleSheet.create({
  page: { gap: tokens.spacing.md, paddingBottom: tokens.spacing.xl, marginHorizontal: -tokens.layout.pageInset, paddingHorizontal: tokens.layout.pageInset, backgroundColor: tokens.colors.home.canvas },
  heroSection: { alignSelf: 'stretch' },
  hero: { position: 'relative', alignSelf: 'stretch', aspectRatio: tokens.size.developmentHeroAspectRatio, borderRadius: tokens.radius.lg, overflow: 'hidden', backgroundColor: tokens.colors.home.progressTrack },
  heroImage: { width: '100%', height: '100%' },
  ageJourney: { alignSelf: 'stretch', marginTop: tokens.spacing.md, borderRadius: tokens.radius.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm, backgroundColor: tokens.colors.home.card },
  currentStage: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.spacing.md },
  currentStageIcon: { width: tokens.size.touchMin, height: tokens.size.touchMin, borderRadius: tokens.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.card },
  currentStageCopy: { flex: 1, gap: tokens.spacing.xs },
  currentStageEyebrow: { ...tokens.typography.eyebrow, color: tokens.colors.home.textMuted },
  currentStageTitle: { ...tokens.typography.heading, color: tokens.colors.home.text },
  currentStageBody: { ...tokens.typography.caption, color: tokens.colors.home.text },
  phasePill: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.sm, paddingVertical: tokens.spacing.xs, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.home.greenFill },
  phaseDot: { width: 7, height: 7, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.onPrimary },
  phaseText: { ...tokens.typography.caption, lineHeight: 18, fontWeight: '700', color: tokens.colors.onPrimary },
  timelineBlock: { alignSelf: 'stretch', gap: tokens.spacing.xs / 2 },
  ageBubbleTouch: { position: 'absolute', bottom: tokens.spacing.sm, minHeight: tokens.size.touchMin, minWidth: tokens.size.developmentAgeMarkerWidth, maxWidth: '100%', alignItems: 'center', justifyContent: 'center' },
  ageBubble: { alignSelf: 'stretch', minHeight: tokens.size.chipMd, paddingHorizontal: tokens.spacing.sm, paddingVertical: tokens.spacing.xs, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.developmentAgeOverlay },
  ageBubbleText: { ...tokens.typography.smallCaption, fontWeight: '700', color: tokens.colors.onPrimary },
  timelineTrackArea: { height: tokens.size.touchMin, justifyContent: 'center' },
  timelineTrack: { height: tokens.size.developmentAgeTrackThickness, marginHorizontal: tokens.size.touchMin / 2, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.borderStrong, overflow: 'hidden' },
  timelineProgress: { height: '100%', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.home.greenStrong },
  timelineMarker: { position: 'absolute', top: (tokens.size.touchMin - tokens.size.developmentAgeMarkerDiameter) / 2, width: tokens.size.developmentAgeMarkerDiameter, height: tokens.size.developmentAgeMarkerDiameter, borderRadius: tokens.radius.full, borderWidth: 2, borderColor: tokens.colors.home.card, backgroundColor: tokens.colors.home.greenStrong },
  markerToggle: { position: 'absolute', top: 0, width: tokens.size.touchMin, height: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  markerToggleDot: { width: tokens.size.developmentAgeMarkerDiameter, height: tokens.size.developmentAgeMarkerDiameter, borderRadius: tokens.radius.full, borderWidth: 2, borderColor: tokens.colors.home.card, backgroundColor: tokens.colors.home.greenStrong },
  phaseLegend: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: tokens.spacing.md, rowGap: tokens.spacing.xs },
  phaseLegendGroup: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flexShrink: 1, gap: tokens.spacing.xs },
  phaseLegendDot: { width: 8, height: 8, borderRadius: tokens.radius.full },
  puppyLegendDot: { backgroundColor: tokens.colors.category.walk.fg },
  adolescentLegendDot: { backgroundColor: tokens.colors.home.greenStrong },
  phaseLegendText: { ...tokens.typography.caption, color: tokens.colors.home.text, fontWeight: '700', flexShrink: 1 },
  phaseRange: { ...tokens.typography.smallCaption, color: tokens.colors.home.textMuted, flexShrink: 1 },
  matureAge: { minHeight: tokens.size.touchMin, alignItems: 'center', flexDirection: 'row', gap: tokens.spacing.md, paddingHorizontal: tokens.spacing.md },
  matureAgeLabel: { ...tokens.typography.eyebrow, color: tokens.colors.home.textMuted },
  matureAgeValue: { ...tokens.typography.heading, color: tokens.colors.home.text },
  unknownAge: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  unknownAgeText: { ...tokens.typography.caption, color: tokens.colors.home.textMuted, flex: 1 },
  sectionHeading: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  sectionTitle: { ...tokens.typography.label, color: tokens.colors.home.text, flex: 1 },
  phaseCard: { gap: tokens.spacing.sm, padding: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.home.card },
  phaseCaption: { ...tokens.typography.smallCaption, color: tokens.colors.home.textMuted },
  contextChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs },
  contextChoice: { minHeight: tokens.size.touchMin, justifyContent: 'center', paddingHorizontal: tokens.spacing.sm, borderRadius: tokens.radius.full, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  contextSelected: { backgroundColor: tokens.colors.home.greenStrong, borderColor: tokens.colors.home.greenStrong },
  contextText: { ...tokens.typography.smallCaption, color: tokens.colors.home.text },
  contextTextSelected: { color: tokens.colors.onPrimary, fontWeight: '700' },
  phaseTitle: { ...tokens.typography.label, color: tokens.colors.home.text },
  phaseRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.xs },
  phaseDivider: { height: tokens.size.stroke, marginLeft: tokens.size.chipMd + tokens.spacing.sm, backgroundColor: tokens.colors.border },
  phaseItem: { ...tokens.typography.caption, color: tokens.colors.home.text, flex: 1 },
  phaseEmpty: { ...tokens.typography.caption, color: tokens.colors.home.textMuted },
  guideSection: { gap: tokens.spacing.xs },
  guideCount: { ...tokens.typography.caption, color: tokens.colors.home.textMuted },
  loadingGuides: { gap: tokens.spacing.sm },
  guideState: { gap: tokens.spacing.sm },
  guideRow: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.home.card },
  guidePressed: { backgroundColor: tokens.colors.selectedSurface },
  bookIcon: { width: tokens.size.buttonHeight, height: tokens.size.buttonHeight, borderRadius: tokens.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.destination.knowledge.surface },
  guideCopy: { flex: 1, gap: tokens.spacing.xs },
  guideTitle: { ...tokens.typography.label, color: tokens.colors.home.text },
});
