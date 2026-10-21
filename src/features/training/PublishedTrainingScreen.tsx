import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppBar, BottomSheet, Button, Card, ListRow, Progress, SectionHeader, Toast } from '../../components/ui';
import type { PausedTrainingProgress, PublishedTrainingProgram } from '../../data/workspace-data';
import { completeReviewTrainingStep, completeTrainingStepForMode, isReviewTrainingProgram, resetReviewTrainingProgram, unmarkReviewTrainingStep, unmarkTrainingStepForMode } from './review-training-state';
import { tokens } from '../../theme/tokens';
import { allProgramsComplete, completedCount, exerciseCountLabel, exerciseProgressLabel, pickNextExercise, programStatus, programStatusWord, sortPrograms, stepStates } from './training-overview';

export function PublishedTrainingScreen({ ageWeeks, programs, paused, busyStepKey, error, onCompleteStep, onUnmarkStep, onContinue, onResetProgram, onRetry, onAddBirthDate, onOpenKnowledge, reviewMode = false, focusStep, onCloseStep }: {
  ageWeeks: number | null; programs: readonly PublishedTrainingProgram[]; paused: readonly PausedTrainingProgress[]; busyStepKey: string | null; error: string;
  reviewMode?: boolean;
  focusStep?: { programId: string; stepId: string; returnPage: 'home' | 'checklist'; readOnly?: boolean };
  onCloseStep?: () => void;
  onCompleteStep: (program: PublishedTrainingProgram, stepId: string) => Promise<{ programId: string; stepId: string } | false>;
  onUnmarkStep?: (program: PublishedTrainingProgram, stepId: string) => Promise<{ programId: string; stepId: string } | false>; onContinue: () => void;
  onResetProgram: (program: PublishedTrainingProgram) => void; onRetry: () => void;
  onAddBirthDate?: () => void; onOpenKnowledge?: () => void;
}) {
  const [openProgramId, setOpenProgramId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ programId: string; stepId: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [reviewCompleted, setReviewCompleted] = useState<Record<string, string[]>>({});
  const [animateCompleteTarget, setAnimateCompleteTarget] = useState<{ key: string; programId: string; stepId: string } | null>(null);
  const animationSequence = useRef(0);
  const pending = useRef(false);
  const mounted = useRef(true);
  const visiblePrograms = reviewMode ? programs.map((program) => ({ ...program, completedStepIds: reviewCompleted[program.id] ?? program.completedStepIds })) : programs;
  const openProgram = visiblePrograms.find((program) => program.id === openProgramId) ?? null;
  const selectedProgram = visiblePrograms.find((program) => program.id === (focusStep?.programId ?? selection?.programId));
  const selectedStep = selectedProgram?.steps.find((step) => step.id === (focusStep?.stepId ?? selection?.stepId));
  const nextStep = selectedProgram?.steps.find((step) => !selectedProgram.completedStepIds.includes(step.id));
  const sortedPrograms = sortPrograms(visiblePrograms);
  const nextExercise = pickNextExercise(sortedPrograms);
  const allComplete = allProgramsComplete(visiblePrograms);
  const heroProgram = nextExercise ? visiblePrograms.find((program) => program.id === nextExercise.programId) : undefined;
  const heroStep = heroProgram?.steps.find((step) => step.id === nextExercise?.stepId);
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
          setSuccessMessage('Övningen är genomförd.'); setSelection(null); onContinue();
        },
        () => onCompleteStep(selectedProgram, selectedStep.id),
      );
      if (!mounted.current) return;
      if (completion.kind === 'review') return;
      const confirmed = completion.value;
      if (confirmed && confirmed.programId === selectedProgram.id && confirmed.stepId === selectedStep.id) {
        const key = `${confirmed.programId}:${confirmed.stepId}:${++animationSequence.current}`;
        setAnimateCompleteTarget({ key, programId: confirmed.programId, stepId: confirmed.stepId });
        setSuccessMessage('Övningen är genomförd.'); setSelection(null); onContinue();
      }
    } finally { if (mounted.current) pending.current = false; }
  }

  async function unmark() {
    if (pending.current || busyStepKey || !selectedProgram || !selectedStep || !selectedProgram.completedStepIds.includes(selectedStep.id)) return;
    pending.current = true;
    try {
      const result = await unmarkTrainingStepForMode<{ programId: string; stepId: string } | false>(
        selectedProgram.id,
        reviewMode,
        () => setReviewCompleted((current) => unmarkReviewTrainingStep(current, selectedProgram.id, selectedStep.id)),
        () => onUnmarkStep ? onUnmarkStep(selectedProgram, selectedStep.id) : Promise.resolve(false),
      );
      if (!mounted.current || result.kind === 'review') return;
      const confirmed = result.value;
      if (confirmed && confirmed.programId === selectedProgram.id && confirmed.stepId === selectedStep.id) {
        setSuccessMessage('Övningen är avmarkerad.');
        onContinue();
      }
    } finally { if (mounted.current) pending.current = false; }
  }

  // Aktuell övning är ett eget kort med en tydlig handling. Klara och kommande övningar är rader som går att läsa.
  function stepRows(program: PublishedTrainingProgram) {
    const states = stepStates(program);
    const currentIndex = states.indexOf('current');
    return <View style={styles.path}>{program.steps.map((step, index) => {
      const state = states[index];
      if (state === 'current') return <View key={step.id} style={styles.currentStep}>
        <Text style={styles.stepMeta}>Nästa övning</Text>
        <Text style={styles.stepMeta}>{`Övning ${index + 1} av ${program.steps.length}`}</Text>
        <Text style={styles.sheetHeading}>{step.title}</Text>
        <Text style={styles.body} numberOfLines={3}>{step.instruction}</Text>
        <Button label="Öva nu" accessibilityLabel={`Nästa övning: ${step.title}, övning ${index + 1} av ${program.steps.length}`} onPress={() => setSelection({ programId: program.id, stepId: step.id })} />
      </View>;
      return <ListRow key={step.id} category="training" title={step.title} titleSize="compact"
        meta={state === 'done' ? 'Klar' : `Kommande · efter övning ${currentIndex + 1}`}
        accessibilityLabel={state === 'done' ? undefined : `Kommande övning: ${step.title}, kommer efter övning ${currentIndex + 1}`}
        complete={state === 'done'} animateCompleteKey={animateCompleteTarget?.programId === program.id && animateCompleteTarget.stepId === step.id ? animateCompleteTarget.key : undefined} onCompleteAnimationStart={consumeCompletionAnimation}
        onPress={() => setSelection({ programId: program.id, stepId: step.id })} />;
    })}</View>;
  }

  function reset(program: PublishedTrainingProgram) {
    if (completedCount(program) === 0) return;
    Alert.alert('Börja om?', `Dina markeringar i ”${program.title}” tas bort.`, [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Börja om', style: 'destructive', onPress: () => reviewMode && isReviewTrainingProgram(program.id)
        ? setReviewCompleted((current) => resetReviewTrainingProgram(current, program.id))
        : onResetProgram(program) },
    ]);
  }

  if (focusStep) return <View testID="home-training-step-detail" style={styles.focusedPage}>
    <AppBar mode="Back" title="Träningssteg"
      actionLabel={focusStep.returnPage === 'checklist' ? 'Tillbaka till Checklistan' : 'Tillbaka till Hem'}
      onAction={onCloseStep ?? onContinue} variant="compact" />
    {!selectedProgram || !selectedStep ? <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>Steget är inte tillgängligt</Text>
      <Text style={styles.body}>Det valda träningssteget kunde inte hämtas från dagens publicerade program.</Text>
      <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta träningssteget igen" onPress={onRetry} />
    </View> : <View style={styles.focusedCard}>
      <Text style={styles.stepMeta}>{selectedProgram.title}</Text>
      <Text accessibilityRole="header" style={styles.sheetHeading}>{selectedStep.title}</Text>
      {selectedProgram.is_ai_generated ? <Text style={styles.note}>AI-genererat innehåll</Text> : null}
      <Text style={styles.body}>{selectedStep.instruction}</Text>
      <Text style={styles.note}>Anpassa efter din hund och pausa när det behövs.</Text>
      {focusStep.readOnly ? <Text style={styles.note}>Historisk aktivitet · skrivskyddad · {selectedProgram.completedStepIds.includes(selectedStep.id) ? 'Klar' : 'Inte markerad'}</Text>
        : selectedProgram.completedStepIds.includes(selectedStep.id) ? <>
        <Text style={styles.note}>Genomförd. Ni kan gärna öva igen.</Text>
        {onUnmarkStep || (reviewMode && isReviewTrainingProgram(selectedProgram.id)) ? <Button variant="tertiary" label="Avmarkera" accessibilityLabel={`Avmarkera ${selectedStep.title}`} loading={busyStepKey === `${selectedProgram.id}:${selectedStep.id}:unmark`} disabled={Boolean(busyStepKey)} onPress={() => { void unmark(); }} /> : null}
      </> : <>
        {nextStep?.id !== selectedStep.id ? <Text style={styles.note}>Börja med {nextStep?.title} innan du markerar den här övningen.</Text> : null}
        <Button label="Markera som genomförd" accessibilityLabel="Markera övningen som genomförd" loading={busyStepKey === `${selectedProgram.id}:${selectedStep.id}`} disabled={Boolean(busyStepKey) || nextStep?.id !== selectedStep.id} onPress={() => { void complete(); }} />
      </>}
      <Toast visible={Boolean(successMessage)} tone="success" confirmed message={successMessage || undefined} autoDismissMs={2500} onAutoDismiss={() => setSuccessMessage('')} />
      <Toast visible={Boolean(error)} tone="error" message={error || undefined} onRetry={onRetry} />
    </View>}
  </View>;

  return <View>
    {openProgram
      ? <AppBar mode="Back" title={openProgram.title} onAction={() => setOpenProgramId(null)} variant="compact" />
      : <Text accessibilityRole="header" style={styles.screenTitle}>Träning</Text>}
    {reviewMode ? <Text style={styles.note}>Tillfälligt exempel – innehållet är inte sakgranskat. Markeringar i dessa övningsutkast sparas under den här visningen.</Text> : null}
    <Toast visible={Boolean(error) && !selectedProgram} tone="error" message={error || undefined} onRetry={onRetry} />
    <Toast visible={Boolean(successMessage) && !selectedProgram} tone="success" confirmed message={successMessage} autoDismissMs={2500} onAutoDismiss={() => setSuccessMessage('')} />
    {paused.map((item) => <View key={item.versionId} style={styles.pausedCard}><Text style={styles.note}>{item.completedCount === 1 ? 'Ett tidigare program är pausat. En genomförd övning finns kvar.' : `Ett tidigare program är pausat. ${item.completedCount} genomförda övningar finns kvar.`}</Text></View>)}

    {openProgram ? <>
      <Progress value={percentage(openProgram)} label={exerciseProgressLabel(openProgram)} />
      {openProgram.steps.length === 0
        ? <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Inga övningar tillgängliga ännu</Text><Text style={styles.body}>Övningarna visas här när de är färdiga.</Text></View>
        : stepRows(openProgram)}
      <Button variant="tertiary" label="Om programmet och källor" accessibilityLabel={`Läs om ${openProgram.title} och dess källor`} onPress={() => setSelection({ programId: openProgram.id, stepId: '' })} />
      {completedCount(openProgram) > 0 ? <Button variant="destructive" label="Börja om" accessibilityLabel={`Börja om med ${openProgram.title}`} disabled={Boolean(busyStepKey)} onPress={() => reset(openProgram)} /> : null}
    </> : visiblePrograms.length === 0 ? error
      ? ageWeeks === null ? <View style={styles.ageHint}>
        <Text style={styles.note}>Lägg till hundens födelsedatum för att se åldersbaserade program. Sparade framsteg finns kvar här.</Text>
        {onAddBirthDate ? <Button label="Lägg till födelsedatum" accessibilityLabel="Lägg till födelsedatum" onPress={onAddBirthDate} /> : null}
      </View> : null
      : <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>{ageWeeks === null ? 'Åldersbaserade program' : 'Träning i er takt'}</Text>
        <Text style={styles.body}>{ageWeeks === null ? 'Lägg till hundens födelsedatum för att se åldersbaserade program. Sparade framsteg finns kvar här.' : 'Fler program kommer när de är färdiga att använda.'}</Text>
        {ageWeeks === null && onAddBirthDate ? <Button label="Lägg till födelsedatum" accessibilityLabel="Lägg till födelsedatum" onPress={onAddBirthDate} /> : null}
        {ageWeeks !== null && onOpenKnowledge ? <Button variant="tertiary" label="Öppna Kunskap" accessibilityLabel="Öppna Kunskap" onPress={onOpenKnowledge} /> : null}
      </View> : <>
      {ageWeeks === null ? <View style={styles.ageHint}>
        <Text style={styles.note}>Åldersbaserade program visas när hundens födelsedatum finns. Era sparade framsteg finns kvar här.</Text>
        {onAddBirthDate ? <Button variant="secondary" label="Lägg till födelsedatum" accessibilityLabel="Lägg till födelsedatum" onPress={onAddBirthDate} /> : null}
      </View> : null}
      {nextExercise && heroProgram && heroStep ? <View style={styles.nextCard}>
        <Text style={styles.stepMeta}>Nästa övning</Text>
        <Text style={styles.sheetHeading}>{heroStep.title}</Text>
        <Text style={styles.stepMeta}>{`${heroProgram.title} · övning ${nextExercise.number} av ${nextExercise.total}`}</Text>
        <Button label="Öva nu" accessibilityLabel={`Öva nu: ${heroStep.title}`} onPress={() => setSelection({ programId: heroProgram.id, stepId: heroStep.id })} />
      </View> : <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>{allComplete ? 'Alla övningar är genomförda' : 'Inga övningar tillgängliga ännu'}</Text>
        <Text style={styles.body}>{allComplete
          ? 'Öppna ett program nedan om ni vill öva igen. Fler program kommer när de är färdiga att använda.'
          : 'Ett eller flera program saknar övningar just nu. De visas här när innehållet är tillgängligt.'}</Text>
      </View>}
      <SectionHeader title="Era program" />
      {ageWeeks !== null ? <Text style={styles.stepMeta}>{`Valda efter hundens ålder, ${ageWeeks} ${ageWeeks === 1 ? 'vecka' : 'veckor'}.`}</Text> : null}
      <View style={styles.programList}>{sortedPrograms.map((program) => {
        const status = programStatus(program);
        const word = programStatusWord(status);
        const progressLabel = exerciseProgressLabel(program);
        return <Card key={program.id} onPress={() => setOpenProgramId(program.id)} accessibilityLabel={`${program.title}, ${word}, ${progressLabel}. Öppna programmet`}>
          <View style={styles.programInner}>
            <View style={styles.programHeader}>
              <Text style={styles.programTitle}>{program.title}</Text>
              <Text style={styles.programStatus}>{word}</Text>
            </View>
            <Text style={styles.stepMeta}>{exerciseCountLabel(program.steps.length)}</Text>
            <Progress value={percentage(program)} label={progressLabel} />
          </View>
        </Card>;
      })}</View>
    </>}

    <BottomSheet visible={Boolean(selectedProgram)} title={selectedStep ? 'Övning' : 'Om programmet'} onRequestClose={() => { if (!busyStepKey) setSelection(null); }}>
      <Text style={styles.sheetHeading}>{selectedStep?.title ?? selectedProgram?.title}</Text>
      {selectedProgram?.is_ai_generated ? <Text style={styles.note}>AI-genererat innehåll</Text> : null}
      <Text style={styles.body}>{selectedStep?.instruction ?? selectedProgram?.body}</Text>
      <Text style={styles.note}>Anpassa efter din hund och pausa när det behövs.</Text>
      {!selectedStep ? <><SectionHeader title="Källor" />{selectedProgram?.sources.map((source) => <Text key={source} style={styles.note}>{source}</Text>)}</> : null}
      {selectedStep && selectedProgram?.completedStepIds.includes(selectedStep.id) ? <>
        <Text style={styles.note}>Genomförd. Ni kan gärna öva igen.</Text>
        {onUnmarkStep || (reviewMode && isReviewTrainingProgram(selectedProgram.id)) ? <Button variant="tertiary" label="Avmarkera" accessibilityLabel={`Avmarkera ${selectedStep.title}`} loading={busyStepKey === `${selectedProgram.id}:${selectedStep.id}:unmark`} disabled={Boolean(busyStepKey)} onPress={() => { void unmark(); }} /> : null}
      </> : selectedStep ? <>
        {nextStep?.id !== selectedStep.id ? <Text style={styles.note}>Börja med {nextStep?.title} innan du markerar den här övningen.</Text> : null}
        <Button label="Markera som genomförd" accessibilityLabel="Markera övningen som genomförd" loading={Boolean(busyStepKey)} disabled={Boolean(busyStepKey) || nextStep?.id !== selectedStep.id} onPress={() => { void complete(); }} />
      </> : null}
      <Toast visible={Boolean(successMessage) && Boolean(selectedProgram)} tone="success" confirmed message={successMessage || undefined} autoDismissMs={2500} onAutoDismiss={() => setSuccessMessage('')} />
      <Toast visible={Boolean(error) && Boolean(selectedProgram)} tone="error" message={error || undefined} onRetry={onRetry} />
    </BottomSheet>
  </View>;
}

function percentage(program: PublishedTrainingProgram) { return program.steps.length ? completedCount(program) / program.steps.length * 100 : 0; }
const styles = StyleSheet.create({
  focusedPage: { gap: tokens.spacing.md, paddingBottom: tokens.spacing.xl },
  focusedCard: { padding: tokens.spacing.lg, gap: tokens.spacing.sm, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.training.continueSurface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  screenTitle: { ...tokens.typography.title, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md },
  ageHint: { gap: tokens.spacing.xs },
  path: { gap: tokens.spacing.xs },
  currentStep: { padding: tokens.spacing.lg, gap: tokens.spacing.sm, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke * 2, borderColor: tokens.colors.primary },
  nextCard: { marginTop: tokens.spacing.sm, padding: tokens.spacing.lg, gap: tokens.spacing.sm, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.training.continueSurface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  stepMeta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  programList: { gap: tokens.spacing.md },
  programInner: { gap: tokens.spacing.sm },
  programHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  programStatus: { ...tokens.typography.caption, color: tokens.colors.textSecondary, fontWeight: '700' },
  pausedCard: { backgroundColor: tokens.colors.training.card, borderRadius: tokens.radius.md, paddingHorizontal: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  emptyCard: { marginTop: tokens.spacing.md, padding: tokens.spacing.lg, backgroundColor: tokens.colors.training.card, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, gap: tokens.spacing.xs },
  emptyTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  programTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
  sheetHeading: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  body: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  note: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginVertical: tokens.spacing.md },
});
