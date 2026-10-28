import { useMemo, useState } from 'react';
import { Alert, Image, Linking, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { AppBar, Button, Skeleton } from '../../components/ui';
import { MessageCard } from '../../components/AppPrimitives';
import { MotionPressable } from '../../components/ui/Motion';
import type { HomeContent } from '../../data/app-data';
import { tokens } from '../../theme/tokens';
import { automaticDogAge } from '../onboarding/dog';
import { homeAgeInWeeks } from './home-today';
import { generalDevelopmentMilestones } from './development-milestones';
import { developmentTitle } from './development-title';

type GuideState = 'loading' | 'ready' | 'error';

export function DevelopmentScreen({ dogName, birthDate, today, guides, guidesState, onBack, onOpenGuide, onRetryGuides }: {
  dogName: string;
  birthDate: string | null;
  today: string;
  guides: readonly HomeContent[];
  guidesState: GuideState;
  onBack: () => void;
  onOpenGuide: (contentId: string) => void;
  onRetryGuides: () => void;
}) {
  const age = useMemo(() => automaticDogAge(birthDate, today), [birthDate, today]);
  const ageProgress = useMemo(() => age && age.stage !== 'VUXEN' ? progressToAdultStage(birthDate, today) : null, [age, birthDate, today]);
  const phaseLabel = age ? formatStage(age.stage) : null;
  const milestones = useMemo(() => generalDevelopmentMilestones(homeAgeInWeeks(birthDate, today)), [birthDate, today]);

  return <View style={styles.page} testID="development-screen">
    <AppBar mode="Back" title={developmentTitle(dogName)} actionLabel="Tillbaka till Hem" onAction={onBack} variant="compact" />

    <View style={styles.hero} testID="development-hero">
      <Image source={require('../../../assets/images/development-hero-puppy-black-tan-forest-wide.jpg')} style={styles.heroImage} resizeMode="cover"
        accessible={false} accessibilityElementsHidden importantForAccessibility="no" />
      <View style={styles.ageJourney}>
        {ageProgress !== null && age && age.stage !== 'VUXEN' ? <AgeArc progress={ageProgress} currentAge={age.label} stage={age.stage} />
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
        <Text style={styles.currentStageBody}>Åldern räknas från födelsedatumet. Fasindelningen är ungefärlig och beskriver kalenderålder, inte färdigheter.</Text>
      </View>
    </View>

    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Hållpunkter i utvecklingen</Text>
    </View>
    <Text style={styles.milestoneBody}>Ungefärliga hållpunkter – varje hund utvecklas i sin egen takt.</Text>
    {milestones.map((milestone) => <MotionPressable key={milestone.id} accessibilityRole="link"
      accessibilityLabel={`${milestone.title}. Läs källan i webbläsaren`}
      onPress={() => { void Linking.openURL(milestone.sourceUrl).catch(() => Alert.alert('Källan kunde inte öppnas', 'Försök igen när anslutningen fungerar.')); }} style={styles.milestoneCard}>
      <View style={styles.milestoneIcon}><Ionicons name="sparkles-outline" size={tokens.size.iconMd} color={tokens.colors.home.greenStrong} accessibilityElementsHidden /></View>
      <View style={styles.milestoneCopy}>
        <Text style={styles.milestoneTitle}>{milestone.title}</Text>
        <Text style={styles.milestoneBody}>{milestone.description}</Text>
        <Text style={styles.sourceLink}>Läs källan</Text>
      </View>
    </MotionPressable>)}
    {milestones.length === 0 ? <Text style={styles.milestoneBody}>{age ? 'Inga generella hållpunkter för den här åldern just nu.' : 'Hållpunkter visas när ett giltigt födelsedatum finns.'}</Text> : null}

    <View style={styles.guideSection}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Guider för er</Text>
        {guides.length > 0 && guidesState === 'ready' ? <Text style={styles.guideCount}>{guides.length}</Text> : null}
      </View>
      {guidesState === 'loading' ? <View style={styles.loadingGuides}>
        <Skeleton shape="row" lines={2} />
        <Skeleton shape="row" lines={2} />
      </View> : null}
      {guidesState === 'error' ? <View style={styles.guideState}>
        <MessageCard tone="error">Guiderna kunde inte hämtas just nu.</MessageCard>
        <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta utvecklingsguider igen" onPress={onRetryGuides} />
      </View> : null}
      {guidesState === 'ready' && age === null ? <MessageCard>Åldersrelevanta guider visas när ett giltigt födelsedatum finns.</MessageCard> : null}
      {guidesState === 'ready' && age !== null && guides.length === 0 ? <MessageCard>Det finns inga publicerade guider för den här åldern ännu.</MessageCard> : null}
      {guidesState === 'ready' ? guides.map((guide) => <GuideRow key={guide.id} guide={guide} onPress={() => onOpenGuide(guide.id)} />) : null}
    </View>
  </View>;
}

function AgeArc({ progress, currentAge, stage }: { progress: number; currentAge: string; stage: 'VALP' | 'UNGHUND' }) {
  const [ageLabelVisible, setAgeLabelVisible] = useState(true);
  const diameter = tokens.size.developmentAgeArcDiameter;
  const radius = diameter / 2;
  const markerSize = tokens.size.developmentAgeArcStroke + 10;
  const bubbleWidth = tokens.size.developmentAgeMarkerWidth;
  const markerX = Math.max(markerSize / 2, Math.min(diameter - markerSize / 2, radius * (1 - Math.cos(progress * Math.PI))));
  const markerY = Math.max(markerSize / 2, Math.min(radius - markerSize / 2, radius * (1 - Math.sin(progress * Math.PI))));
  const arcRadius = radius - tokens.size.developmentAgeArcStroke / 2;
  const arcLength = Math.PI * arcRadius;
  const arcPath = `M ${tokens.size.developmentAgeArcStroke / 2} ${radius} A ${arcRadius} ${arcRadius} 0 0 1 ${diameter - tokens.size.developmentAgeArcStroke / 2} ${radius}`;
  const bubbleLeft = Math.max(0, Math.min(diameter - bubbleWidth, markerX - bubbleWidth / 2));
  const bubbleTop = markerY < tokens.size.chipMd + tokens.spacing.xs ? markerY + tokens.spacing.md : markerY - tokens.size.chipMd - tokens.spacing.xs;
  const bubbleHitWidth = bubbleWidth + 16;
  const bubbleButtonLeft = Math.max(0, Math.min(diameter - bubbleHitWidth, bubbleLeft - 8));
  const bubbleButtonTop = Math.max(0, Math.min(diameter / 2 - tokens.size.touchMin, bubbleTop - 6));
  const markerHitSize = tokens.size.touchMin;
  const markerButtonLeft = markerX - markerHitSize / 2;
  const markerButtonTop = markerY - markerHitSize / 2;
  const phaseName = formatStage(stage);
  return <View style={styles.arcBlock}>
    <View style={styles.arcAccessible}>
      <View style={styles.arcClip}>
        <Svg accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none"
          width={diameter} height={diameter / 2} viewBox={`0 0 ${diameter} ${diameter / 2}`} style={styles.arcSvg}>
          <Path testID="development-age-arc-track" d={arcPath} fill="none" stroke={tokens.colors.home.progressTrack}
            strokeWidth={tokens.size.developmentAgeArcStroke} strokeLinecap="round" />
          {progress > 0 ? <Path testID="development-age-progress" d={arcPath} fill="none" stroke={tokens.colors.home.greenStrong}
            strokeWidth={tokens.size.developmentAgeArcStroke} strokeDasharray={`${arcLength * progress} ${arcLength}`}
            strokeLinecap="round" /> : null}
        </Svg>
        {[0.25, 0.5, 0.75].map((tick) => {
          const left = radius * (1 - Math.cos(tick * Math.PI));
          const top = Math.max(3, radius * (1 - Math.sin(tick * Math.PI)));
          return <View key={tick} style={[styles.arcTick, progress >= tick && styles.arcTickReached, { left: left - 3, top: top - 3 }]} />;
        })}
        {ageLabelVisible ? <View style={[styles.arcCurrent, { width: markerSize, height: markerSize, borderRadius: markerSize / 2,
          left: markerX - markerSize / 2, top: markerY - markerSize / 2 }]} /> : null}
      </View>
      {ageLabelVisible ? <MotionPressable testID="development-age-pill" accessibilityRole="button"
        accessibilityLabel={`Dölj åldersmarkeringen ${currentAge}. Fas ${phaseName}.`}
        accessibilityHint="Döljer åldersetiketten. Tryck sedan på markören för att visa den igen."
        onPress={() => setAgeLabelVisible(false)} style={[styles.ageBubbleTouch, { width: bubbleHitWidth, height: tokens.size.touchMin,
          left: bubbleButtonLeft, top: bubbleButtonTop }]}>
        <View style={styles.ageBubble}><Text style={styles.ageBubbleText}>{currentAge}</Text></View>
      </MotionPressable> : <MotionPressable testID="development-age-marker-toggle" accessibilityRole="button"
        accessibilityLabel={`Visa åldersmarkeringen ${currentAge}. Fas ${phaseName}.`}
        onPress={() => setAgeLabelVisible(true)} style={[styles.markerToggle, { width: markerHitSize, height: markerHitSize,
          borderRadius: markerHitSize / 2, left: markerButtonLeft, top: markerButtonTop }]}>
        <View style={[styles.markerToggleDot, { width: markerSize, height: markerSize, borderRadius: markerSize / 2 }]} />
      </MotionPressable>}
    </View>
    <View style={styles.phaseLegend}>
      <View style={styles.phaseLegendGroup}><View style={[styles.phaseLegendDot, styles.puppyLegendDot]} /><Text style={styles.phaseLegendText}>Valp</Text><Text style={styles.phaseRange}>0–6 mån</Text></View>
      <View style={styles.phaseLegendGroup}><View style={[styles.phaseLegendDot, styles.adolescentLegendDot]} /><Text style={styles.phaseLegendText}>Unghund</Text><Text style={styles.phaseRange}>6–24 mån</Text></View>
    </View>
  </View>;
}

function GuideRow({ guide, onPress }: { guide: HomeContent; onPress: () => void }) {
  const teaser = guide.body.split(/\n\s*\n/).find((part) => part.trim() && !/^\s*#{1,6}\s/.test(part))
    ?.replace(/^\s*[-*]\s+/gm, '').trim();
  return <MotionPressable accessibilityRole="button" accessibilityLabel={`Öppna guide: ${guide.title}`}
    onPress={onPress} style={({ pressed }) => [styles.guideRow, pressed && styles.guidePressed]}>
    <View style={styles.bookIcon}><Ionicons name="book-outline" size={tokens.size.iconMd} color={tokens.colors.destination.knowledge.icon} accessibilityElementsHidden /></View>
    <View style={styles.guideCopy}>
      <Text style={styles.guideTitle} numberOfLines={2}>{guide.title}</Text>
      {teaser ? <Text style={styles.guideTeaser} numberOfLines={2}>{teaser}</Text> : null}
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
  hero: { position: 'relative', alignSelf: 'stretch', height: tokens.size.developmentHeroHeight, borderRadius: tokens.radius.lg, overflow: 'hidden', backgroundColor: tokens.colors.home.progressTrack },
  heroImage: { width: '100%', height: '100%' },
  ageJourney: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: tokens.size.developmentAgeJourneyHeight, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.xs, backgroundColor: tokens.colors.home.heroOverlay },
  currentStage: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.spacing.md, paddingVertical: tokens.spacing.sm },
  currentStageIcon: { width: tokens.size.buttonHeight, height: tokens.size.buttonHeight, borderRadius: tokens.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.card },
  currentStageCopy: { flex: 1, gap: tokens.spacing.xs },
  currentStageEyebrow: { ...tokens.typography.eyebrow, color: tokens.colors.home.textMuted },
  currentStageTitle: { ...tokens.typography.heading, color: tokens.colors.home.text },
  currentStageBody: { ...tokens.typography.caption, color: tokens.colors.home.text },
  phasePill: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.sm, paddingVertical: tokens.spacing.xs, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.home.greenFill },
  phaseDot: { width: 7, height: 7, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.onPrimary },
  phaseText: { ...tokens.typography.caption, lineHeight: 18, fontWeight: '700', color: tokens.colors.onPrimary },
  arcBlock: { alignItems: 'center', gap: tokens.spacing.xs / 2 },
  arcAccessible: { width: tokens.size.developmentAgeArcDiameter, height: tokens.size.developmentAgeArcDiameter / 2, overflow: 'visible' },
  arcClip: { position: 'relative', width: tokens.size.developmentAgeArcDiameter, height: tokens.size.developmentAgeArcDiameter / 2, overflow: 'hidden' },
  arcSvg: { position: 'absolute', top: 0, left: 0 },
  arcTick: { position: 'absolute', width: 6, height: 6, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.borderStrong },
  arcTickReached: { backgroundColor: tokens.colors.home.greenStrong },
  arcCurrent: { position: 'absolute', borderWidth: 2, borderColor: tokens.colors.home.card, backgroundColor: tokens.colors.home.greenStrong },
  ageBubbleTouch: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ageBubble: { width: tokens.size.developmentAgeMarkerWidth, minHeight: tokens.size.chipMd, paddingHorizontal: tokens.spacing.sm, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.greenStrong },
  markerToggle: { position: 'absolute', alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.home.card, borderWidth: 1, borderColor: tokens.colors.home.greenStrong },
  markerToggleDot: { borderWidth: 2, borderColor: tokens.colors.home.card, backgroundColor: tokens.colors.home.greenStrong },
  ageBubbleText: { ...tokens.typography.smallCaption, fontWeight: '700', color: tokens.colors.onPrimary },
  phaseLegend: { width: tokens.size.developmentAgeArcDiameter + tokens.spacing.xxl, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: tokens.spacing.md, rowGap: tokens.spacing.xs },
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
  milestoneCard: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.spacing.md, padding: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.home.card },
  milestoneIcon: { width: tokens.size.buttonHeight, height: tokens.size.buttonHeight, borderRadius: tokens.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.selectedSurface },
  milestoneCopy: { flex: 1, gap: tokens.spacing.xs },
  milestoneTitle: { ...tokens.typography.label, color: tokens.colors.home.text },
  milestoneBody: { ...tokens.typography.caption, color: tokens.colors.home.textMuted },
  sourceLink: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  guideSection: { gap: tokens.spacing.xs },
  guideCount: { ...tokens.typography.caption, color: tokens.colors.home.textMuted },
  loadingGuides: { gap: tokens.spacing.sm },
  guideState: { gap: tokens.spacing.sm },
  guideRow: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.home.card },
  guidePressed: { backgroundColor: tokens.colors.selectedSurface },
  bookIcon: { width: tokens.size.buttonHeight, height: tokens.size.buttonHeight, borderRadius: tokens.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.destination.knowledge.surface },
  guideCopy: { flex: 1, gap: tokens.spacing.xs },
  guideTitle: { ...tokens.typography.label, color: tokens.colors.home.text },
  guideTeaser: { ...tokens.typography.caption, color: tokens.colors.home.textMuted },
});
