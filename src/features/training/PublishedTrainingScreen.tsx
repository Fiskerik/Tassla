import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { BottomSheet, Button, HeroCard, ListRow, Progress, SectionHeader, Tabs, Toast } from '../../components/ui';
import { MotionPressable } from '../../components/ui/Motion';
import type { PausedTrainingProgress, PublishedTrainingProgram } from '../../data/workspace-data';
import { completeReviewTrainingStep, completeTrainingStepForMode, isReviewTrainingProgram, resetReviewTrainingProgram } from './review-training-state';
import { tokens } from '../../theme/tokens';

const trainingImage = require('../../../assets/images/puppy-training.png');
const tabs = ['Rekommenderat', 'Alla övningar', 'Mina'] as const;

export function PublishedTrainingScreen({ ageWeeks, programs, paused, busyStepKey, error, onCompleteStep, onContinue, onResetProgram, onRetry, reviewMode = false }: {
  ageWeeks: number | null; programs: readonly PublishedTrainingProgram[]; paused: readonly PausedTrainingProgress[]; busyStepKey: string | null; error: string;
  reviewMode?: boolean;
  onCompleteStep: (program: PublishedTrainingProgram, stepId: string) => Promise<{ programId: string; stepId: string } | false>; onContinue: () => void;
  onResetProgram: (program: PublishedTrainingProgram) => void; onRetry: () => void;
}) {
  const [tab, setTab] = useState<string>(tabs[0]);
  const [programId, setProgramId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ programId: string; stepId: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [reviewCompleted, setReviewCompleted] = useState<Record<string, string[]>>({});
  const [animateCompleteTarget, setAnimateCompleteTarget] = useState<{ key: string; programId: string; stepId: string } | null>(null);
  const animationSequence = useRef(0);
  const pending = useRef(false);
  const mounted = useRef(true);
  const visiblePrograms = reviewMode ? programs.map((program) => ({ ...program, completedStepIds: reviewCompleted[program.id] ?? program.completedStepIds })) : programs;
  const active = visiblePrograms.find((program) => program.id === programId) ?? visiblePrograms[0];
  const selectedProgram = visiblePrograms.find((program) => program.id === selection?.programId);
  const selectedStep = selectedProgram?.steps.find((step) => step.id === selection?.stepId);
  const nextStep = selectedProgram?.steps.find((step) => !selectedProgram.completedStepIds.includes(step.id));
  const mine = visiblePrograms.filter((program) => program.completedStepIds.length > 0);
  const continueProgram = visiblePrograms.find((program) => program.completedStepIds.length > 0 && program.steps.some((step) => !program.completedStepIds.includes(step.id)));
  const continueStep = continueProgram?.steps.find((step) => !continueProgram.completedStepIds.includes(step.id));
  const consumeCompletionAnimation = useCallback((key: string) => {
    setAnimateCompleteTarget((current) => current?.key === key ? null : current);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function complete() {
    if (pending.current || busyStepKey || !selectedProgram || !selectedStep) return;
    pending.current = true;
    try {
      const completion = await completeTrainingStepForMode(
        selectedProgram.id,
        reviewMode,
        () => {
          setReviewCompleted((current) => completeReviewTrainingStep(current, selectedProgram.id, selectedStep.id));
          setSaved(true); setSelection(null); onContinue();
        },
        () => onCompleteStep(selectedProgram, selectedStep.id),
      );
      if (!mounted.current) return;
      if (completion.kind === 'review') return;
      const confirmed = completion.value;
      if (confirmed && confirmed.programId === selectedProgram.id && confirmed.stepId === selectedStep.id) {
        const key = `${confirmed.programId}:${confirmed.stepId}:${++animationSequence.current}`;
        setAnimateCompleteTarget({ key, programId: confirmed.programId, stepId: confirmed.stepId });
        setSaved(true); setSelection(null); onContinue();
      }
    } finally { if (mounted.current) pending.current = false; }
  }

  function rows(program: PublishedTrainingProgram) {
    return <View style={styles.rows}>{program.steps.map((step) => <ListRow key={step.id} category="training" title={step.title} titleSize="compact"
      complete={program.completedStepIds.includes(step.id)} animateCompleteKey={animateCompleteTarget?.programId === program.id && animateCompleteTarget.stepId === step.id ? animateCompleteTarget.key : undefined} onCompleteAnimationStart={consumeCompletionAnimation}
      onPress={() => setSelection({ programId: program.id, stepId: step.id })} />)}</View>;
  }

  function programCards(items: readonly PublishedTrainingProgram[]) {
    return <View style={styles.programGrid}>{items.map((program) => <View key={program.id} style={styles.programCard}>
      <HeroCard variant="training-image-top" image={trainingImage} title={program.title}
        meta={`${program.steps.length} ${program.steps.length === 1 ? 'övning' : 'övningar'}`}
        onPress={() => setProgramId(program.id)} selected={active?.id === program.id}>
        <Text style={styles.programSummary} numberOfLines={2}>{program.body}</Text>
      </HeroCard>
    </View>)}</View>;
  }

  function reset(program: PublishedTrainingProgram) {
    Alert.alert('Börja om?', `Dina markeringar i ”${program.title}” tas bort.`, [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Börja om', style: 'destructive', onPress: () => reviewMode && isReviewTrainingProgram(program.id)
        ? setReviewCompleted((current) => resetReviewTrainingProgram(current, program.id))
        : onResetProgram(program) },
    ]);
  }

  return <View>
    <Text accessibilityRole="header" style={styles.screenTitle}>Träning</Text>
    <Tabs items={tabs} active={tab} onChange={setTab} variant="rev02-segmented" />
    {reviewMode ? <Text style={styles.note}>Tillfälligt exempel – innehållet är inte sakgranskat. Markeringar i dessa övningsutkast sparas under den här visningen.</Text> : null}
    <Toast visible={Boolean(error)} tone="error" message={error || undefined} onRetry={onRetry} />
    <Toast visible={saved} tone="success" confirmed message="Övningen är genomförd" autoDismissMs={2500} onAutoDismiss={() => setSaved(false)} />
    {paused.map((item) => <View key={item.versionId} style={styles.pausedCard}><Text style={styles.note}>Ett tidigare program är pausat. Dina {item.completedCount} genomförda steg finns kvar.</Text></View>)}

    {visiblePrograms.length === 0 && tab !== 'Mina' ? <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{ageWeeks === null ? 'Åldersbaserade program' : 'Träning i er takt'}</Text>
      <Text style={styles.body}>{ageWeeks === null ? 'Lägg till hundens födelsedatum för att se åldersbaserade program. Sparade framsteg finns under Mina.' : 'Fler program kommer när de är färdiga att använda.'}</Text>
    </View> : null}

    {tab === 'Rekommenderat' && visiblePrograms.length > 0 ? <>
      {ageWeeks === null ? <View style={styles.unknownAgeNotice}>
        <Text style={styles.body}>Åldersbaserade program visas när hundens födelsedatum finns. Dina sparade framsteg finns kvar under Mina.</Text>
        <Button variant="tertiary" label="Visa mina program" accessibilityLabel="Visa mina sparade träningsprogram" onPress={() => setTab('Mina')} />
      </View> : <>
        <View style={styles.ageHeading}>
          <Text style={styles.sectionTitle}>{`Passar just nu (${ageWeeks} ${ageWeeks === 1 ? 'vecka' : 'veckor'})`}</Text>
          <MotionPressable accessibilityRole="button" accessibilityLabel="Visa alla övningar" onPress={() => setTab('Alla övningar')} style={({ pressed }) => [styles.seeAllButton, pressed && styles.pressed]}>
            <Text style={styles.seeAll}>Visa alla</Text>
          </MotionPressable>
        </View>
        {programCards(visiblePrograms)}
      </>}
      {continueProgram && continueStep ? <MotionPressable accessibilityRole="button" accessibilityLabel={`Fortsätt där ni var: ${continueProgram.title}, ${continueStep.title}`} onPress={() => setSelection({ programId: continueProgram.id, stepId: continueStep.id })} style={({ pressed }) => [styles.continueCard, pressed && styles.pressed]}>
        <Image source={trainingImage} style={styles.continueImage} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        <View style={styles.continueContent}>
          <Text style={styles.continueEyebrow}>FORTSÄTT DÄR NI VAR</Text>
          <Text style={styles.continueTitle}>{continueProgram.title}</Text>
          <Text style={styles.continueStep}>{continueStep.title}</Text>
          <Progress value={percentage(continueProgram)} label={`${continueProgram.completedStepIds.length} av ${continueProgram.steps.length} steg markerade`} />
        </View>
      </MotionPressable> : null}
      {active && ageWeeks !== null ? <>
        <SectionHeader title={active.title} />
        {rows(active)}
        <Button variant="tertiary" label="Om programmet" accessibilityLabel="Läs om programmet och dess källor" onPress={() => setSelection({ programId: active.id, stepId: '' })} />
      </> : null}
    </> : null}

    {tab === 'Alla övningar' ? visiblePrograms.map((program) => <View key={program.id}>
      <SectionHeader title={program.title} />{rows(program)}
      <Button variant="tertiary" label="Om programmet" accessibilityLabel={`Läs om ${program.title} och dess källor`} onPress={() => setSelection({ programId: program.id, stepId: '' })} />
    </View>) : null}

    {tab === 'Mina' ? mine.length ? mine.map((program) => <View key={program.id} style={styles.mineCard}>
      <Text style={styles.programTitle}>{program.title}</Text>
      <Progress value={percentage(program)} label={`${program.completedStepIds.length} av ${program.steps.length} steg markerade`} />
      {rows(program)}
      {program.completedStepIds.length ? <Button variant="destructive" label="Börja om" accessibilityLabel={`Börja om med ${program.title}`} disabled={Boolean(busyStepKey)} onPress={() => reset(program)} /> : null}
    </View>) : <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{reviewMode ? 'Dina markeringar visas här' : 'Inga påbörjade program ännu'}</Text>
      <Text style={styles.body}>{reviewMode ? 'Öppna ett tillfälligt exempel och markera ett steg för att se hur framsteg visas.' : 'När du markerar ett steg som genomfört hittar du programmets framsteg här.'}</Text>
    </View> : null}

    <BottomSheet visible={Boolean(selectedProgram)} title={selectedStep ? 'Övning' : 'Om programmet'} onRequestClose={() => { if (!busyStepKey) setSelection(null); }}>
      <Text style={styles.sheetHeading}>{selectedStep?.title ?? selectedProgram?.title}</Text>
      <Text style={styles.body}>{selectedStep?.instruction ?? selectedProgram?.body}</Text>
      <Text style={styles.note}>Anpassa efter din hund och pausa när det behövs.</Text>
      {!selectedStep ? <><SectionHeader title="Källor" />{selectedProgram?.sources.map((source) => <Text key={source} style={styles.note}>{source}</Text>)}</> : null}
      <Toast visible={Boolean(error)} tone="error" message={error || undefined} onRetry={onRetry} />
      {selectedStep && selectedProgram?.completedStepIds.includes(selectedStep.id) ? <Text style={styles.note}>Genomförd. Ni kan gärna öva igen.</Text> : selectedStep ? <>
        {nextStep?.id !== selectedStep.id ? <Text style={styles.note}>Börja med {nextStep?.title} innan du markerar den här övningen.</Text> : null}
        <Button label="Markera som genomförd" accessibilityLabel="Markera övningen som genomförd" loading={Boolean(busyStepKey)} disabled={Boolean(busyStepKey) || nextStep?.id !== selectedStep.id} onPress={() => { void complete(); }} />
      </> : null}
    </BottomSheet>
  </View>;
}

function percentage(program: PublishedTrainingProgram) { return program.steps.length ? program.completedStepIds.length / program.steps.length * 100 : 0; }
const styles = StyleSheet.create({
  screenTitle: { ...tokens.typography.title, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md },
  rows: { gap: tokens.spacing.xs },
  programGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md, marginTop: tokens.spacing.md },
  programCard: { flexBasis: '47%', flexGrow: 0, flexShrink: 1, minWidth: 145 },
  ageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm, marginTop: tokens.spacing.md },
  sectionTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
  seeAllButton: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'flex-end', justifyContent: 'center' },
  seeAll: { ...tokens.typography.caption, color: tokens.colors.training.accent, fontWeight: '700' },
  programSummary: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  unknownAgeNotice: { gap: tokens.spacing.xs, paddingTop: tokens.spacing.md },
  continueCard: { minHeight: tokens.size.touchMin, marginTop: tokens.spacing.md, flexDirection: 'row', borderRadius: tokens.radius.md, overflow: 'hidden', backgroundColor: tokens.colors.training.continueSurface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  continueImage: { width: tokens.size.trainingContinueImage, minHeight: 120 },
  continueContent: { flex: 1, justifyContent: 'center', padding: tokens.spacing.md, gap: tokens.spacing.xs },
  continueEyebrow: { ...tokens.typography.caption, color: tokens.colors.training.accent, fontWeight: '700' },
  continueTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  continueStep: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  pressed: { opacity: 0.82 },
  pausedCard: { backgroundColor: tokens.colors.training.card, borderRadius: tokens.radius.md, paddingHorizontal: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  emptyCard: { marginTop: tokens.spacing.md, padding: tokens.spacing.lg, backgroundColor: tokens.colors.training.card, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, gap: tokens.spacing.xs },
  emptyTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  mineCard: { marginTop: tokens.spacing.md, padding: tokens.spacing.md, gap: tokens.spacing.md, backgroundColor: tokens.colors.training.card, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  programTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  sheetHeading: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  body: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  note: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginVertical: tokens.spacing.md },
});
