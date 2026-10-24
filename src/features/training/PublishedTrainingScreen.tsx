import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppBar, BottomSheet, Button, Card, Dialog, ListRow, Progress, SectionHeader, Tabs, Toast } from '../../components/ui';
import type { HistoricalTrainingStepDetail, PausedTrainingProgress, PublishedTrainingProgram } from '../../data/workspace-data';
import { completeReviewTrainingStep, completeTrainingStepForMode, isReviewTrainingProgram, resetReviewTrainingProgram, unmarkReviewTrainingStep, unmarkTrainingStepForMode } from './review-training-state';
import { tokens } from '../../theme/tokens';
import { allProgramsComplete, completedCount, exerciseCountLabel, exerciseProgressLabel, pickNextExercise, programStatus, programStatusWord, programsWithProgress, recommendedPrograms, sortPrograms, stepStates } from './training-overview';

export function PublishedTrainingScreen({ ageWeeks, programs, paused, busyStepKey, error, onCompleteStep, onUnmarkStep, onContinue, onResetProgram, onRetry, onAddBirthDate, onOpenKnowledge, reviewMode = false, focusStep, historicalDetail, onCloseStep }: {
  ageWeeks: number | null; programs: readonly PublishedTrainingProgram[]; paused: readonly PausedTrainingProgress[]; busyStepKey: string | null; error: string;
  reviewMode?: boolean;
  focusStep?: { programId: string; stepId: string; returnPage: 'home' | 'checklist' | 'progress'; readOnly?: boolean; dateKey?: string; completed?: boolean };
  historicalDetail?: { status: 'loading' | 'ready' | 'partial' | 'unavailable'; detail: HistoricalTrainingStepDetail | null };
  onCloseStep?: () => void;
  onCompleteStep: (program: PublishedTrainingProgram, stepId: string) => Promise<{ programId: string; stepId: string } | false>;
  onUnmarkStep?: (program: PublishedTrainingProgram, stepId: string) => Promise<{ programId: string; stepId: string } | false>; onContinue: () => void;
  onResetProgram: (program: PublishedTrainingProgram) => void; onRetry: () => void;
  onAddBirthDate?: () => void; onOpenKnowledge?: () => void;
}) {
  const [openProgramId, setOpenProgramId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ programId: string; stepId: string } | null>(null);
  const [selectedView, setSelectedView] = useState<'recommended' | 'all' | 'mine'>('recommended');
  const [successMessage, setSuccessMessage] = useState('');
  const [reviewCompleted, setReviewCompleted] = useState<Record<string, string[]>>({});
  const [resetTarget, setResetTarget] = useState<{ program: PublishedTrainingProgram; fingerprint: string } | null>(null);
  const [recommendationCopyHeight, setRecommendationCopyHeight] = useState<{ key: string; height: number } | null>(null);
  const [animateCompleteTarget, setAnimateCompleteTarget] = useState<{ key: string; programId: string; stepId: string } | null>(null);
  const animationSequence = useRef(0);
  const resetFlight = useRef<{ programId: string; sawBusy: boolean } | null>(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  const visiblePrograms = reviewMode ? programs.map((program) => ({ ...program, currentAgeBreedMatch: true, completedStepIds: reviewCompleted[program.id] ?? program.completedStepIds })) : programs;
  const openProgram = visiblePrograms.find((program) => program.id === openProgramId) ?? null;
  const currentResetProgram = resetTarget ? visiblePrograms.find((program) => program.id === resetTarget.program.id) : null;
  const resetTargetIsCurrent = Boolean(resetTarget && !focusStep && currentResetProgram && openProgramId === resetTarget.program.id
    && programResetFingerprint(currentResetProgram) === resetTarget.fingerprint);
  if (resetTarget && !resetTargetIsCurrent) setResetTarget(null);
  const selectedProgram = visiblePrograms.find((program) => program.id === (focusStep?.programId ?? selection?.programId));
  const selectedStep = selectedProgram?.steps.find((step) => step.id === (focusStep?.stepId ?? selection?.stepId));
  const nextStep = selectedProgram?.steps.find((step) => !selectedProgram.completedStepIds.includes(step.id));
  const sortedPrograms = sortPrograms(visiblePrograms);
  const ageMatchedPrograms = recommendedPrograms(visiblePrograms);
  const minePrograms = programsWithProgress(visiblePrograms);
  const nextExercise = pickNextExercise(sortedPrograms);
  const allComplete = allProgramsComplete(visiblePrograms);
  const heroProgram = nextExercise ? visiblePrograms.find((program) => program.id === nextExercise.programId) : undefined;
  const continuationProgram = nextExercise?.kind === 'continue' ? heroProgram : undefined;
  const continuationStep = continuationProgram?.steps.find((step) => step.id === nextExercise?.stepId);
  const { width: viewportWidth, fontScale } = useWindowDimensions();
  const stackRecommendations = viewportWidth < 350 || fontScale > 1.2;
  const recommendationLayoutKey = JSON.stringify({
    width: viewportWidth,
    fontScale,
    items: ageMatchedPrograms.slice(0, 2).map((program) => {
      const next = pickNextExercise([program]);
      const step = next && program.steps.find((candidate) => candidate.id === next.stepId);
      return [program.id, program.title, step?.id, step?.title];
    }),
  });
  const currentRecommendationCopyHeight = recommendationCopyHeight?.key === recommendationLayoutKey ? recommendationCopyHeight.height : undefined;
  function recordRecommendationCopyHeight(height: number) {
    setRecommendationCopyHeight((current) => {
      const nextHeight = Math.ceil(height);
      if (current?.key === recommendationLayoutKey && nextHeight <= current.height + 1) return current;
      return { key: recommendationLayoutKey, height: nextHeight };
    });
  }
  const consumeCompletionAnimation = useCallback((key: string) => {
    setAnimateCompleteTarget((current) => current?.key === key ? null : current);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const flight = resetFlight.current;
    if (!flight) return;
    if (busyStepKey === `${flight.programId}:reset`) { flight.sawBusy = true; return; }
    const current = visiblePrograms.find((program) => program.id === flight.programId);
    if (!busyStepKey && (flight.sawBusy || (current && completedCount(current) === 0) || Boolean(error))) resetFlight.current = null;
  }, [busyStepKey, error, visiblePrograms]);

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

  function openResetConfirmation(program: PublishedTrainingProgram) {
    if (completedCount(program) === 0 || busyStepKey || resetFlight.current) return;
    setResetTarget({ program, fingerprint: programResetFingerprint(program) });
  }

  function confirmReset() {
    const target = resetTarget;
    if (!target || resetFlight.current || busyStepKey) return;
    const current = visiblePrograms.find((program) => program.id === target.program.id);
    if (openProgramId !== target.program.id || !current || programResetFingerprint(current) !== target.fingerprint || completedCount(current) === 0) {
      setResetTarget(null);
      return;
    }
    resetFlight.current = { programId: target.program.id, sawBusy: false };
    setResetTarget(null);
    if (reviewMode && isReviewTrainingProgram(target.program.id)) {
      setReviewCompleted((value) => resetReviewTrainingProgram(value, target.program.id));
      resetFlight.current = null;
      return;
    }
    onResetProgram(target.program);
  }

  if (focusStep?.readOnly) return <View testID="historical-training-step-detail" style={styles.focusedPage}>
    <AppBar mode="Back" title="Träningssteg" actionLabel="Tillbaka till Checklistan" onAction={onCloseStep ?? onContinue} variant="compact" />
    {historicalDetail?.status === 'loading' || !historicalDetail ? <View style={styles.focusedCard}>
      <Text style={styles.stepMeta}>Sparad aktivitet · {formatHistoricalDate(focusStep.dateKey)}</Text>
      <Text style={styles.body}>Hämtar det publicerade träningssteget…</Text>
    </View> : historicalDetail.status === 'partial' ? <View style={styles.focusedCard}>
      <Text style={styles.emptyTitle}>Steget kunde inte hämtas</Text>
      <Text style={styles.body}>Försök igen när anslutningen fungerar.</Text>
      <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta träningssteget igen" onPress={onRetry} />
    </View> : historicalDetail.status === 'unavailable' || !historicalDetail.detail ? <View style={styles.focusedCard}>
      <Text style={styles.emptyTitle}>Steget är inte längre tillgängligt</Text>
      <Text style={styles.body}>Det publicerade träningssteget kunde inte hittas. Checklistan uppdateras när du går tillbaka.</Text>
    </View> : <View style={styles.focusedCard}>
      <Text style={styles.stepMeta}>{historicalDetail.detail.programTitle} · {formatHistoricalDate(focusStep.dateKey)}</Text>
      <Text accessibilityRole="header" style={styles.sheetHeading}>{historicalDetail.detail.stepTitle}</Text>
      {historicalDetail.detail.isAiGenerated ? <Text style={styles.note}>AI-genererat innehåll</Text> : null}
      <Text style={styles.body}>{historicalDetail.detail.instruction}</Text>
      <Text style={styles.note}>{focusStep.completed ? 'Markerad som genomförd' : 'Inte markerad för den dagen'} · Endast läsning</Text>
    </View>}
  </View>;

  if (focusStep) return <View testID="home-training-step-detail" style={styles.focusedPage}>
    <AppBar mode="Back" title="Träningssteg"
      actionLabel={focusStep.returnPage === 'checklist' ? 'Tillbaka till Checklistan' : focusStep.returnPage === 'progress' ? 'Tillbaka till Dagens framsteg' : 'Tillbaka till Hem'}
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
      {selectedProgram.completedStepIds.includes(selectedStep.id) ? <>
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
      ? <AppBar mode="Back" title={openProgram.title} onAction={() => { setResetTarget(null); setOpenProgramId(null); }} variant="compact" />
      : <Text accessibilityRole="header" style={styles.screenTitle}>Träning</Text>}
    <Toast visible={Boolean(error) && !selectedProgram} tone="error" message={error || undefined} onRetry={onRetry} />
    <Toast visible={Boolean(successMessage) && !selectedProgram} tone="success" confirmed message={successMessage} autoDismissMs={2500} onAutoDismiss={() => setSuccessMessage('')} />

    {openProgram ? <>
      <Progress value={percentage(openProgram)} label={exerciseProgressLabel(openProgram)} />
      {openProgram.steps.length === 0
        ? <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Inga övningar tillgängliga ännu</Text><Text style={styles.body}>Övningarna visas här när de är färdiga.</Text></View>
        : stepRows(openProgram)}
      <View style={styles.programActions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Läs om ${openProgram.title} och dess källor`} onPress={() => setSelection({ programId: openProgram.id, stepId: '' })} style={({ pressed }) => [styles.programInfoAction, pressed && styles.pressed]}>
          <Ionicons name="information-circle-outline" size={tokens.size.iconSm} color={tokens.colors.training.accent} />
          <Text style={styles.programInfoLabel}>Om programmet och källor</Text>
        </Pressable>
        {completedCount(openProgram) > 0 ? <Pressable accessibilityRole="button" accessibilityLabel={`Börja om med ${openProgram.title}`}
          accessibilityHint="Öppnar en bekräftelse innan markeringarna tas bort."
          accessibilityState={{ disabled: Boolean(busyStepKey) }}
          disabled={Boolean(busyStepKey)} onPress={() => openResetConfirmation(openProgram)}
          style={({ pressed }) => [styles.resetIconAction, busyStepKey && styles.disabledAction, pressed && !busyStepKey && styles.pressed]}>
          <Ionicons name="refresh-outline" size={tokens.size.iconMd} color={tokens.colors.danger} />
        </Pressable> : null}
      </View>
    </> : <>
      <View testID="training-view-tabs">
        <Tabs items={['Rekommenderat', 'Alla övningar', 'Mina']} active={selectedView === 'recommended' ? 'Rekommenderat' : selectedView === 'all' ? 'Alla övningar' : 'Mina'}
          accessibilityLabel="Träningsvyer" variant="rev02-segmented"
          onChange={(label) => { if (label === 'Rekommenderat') setSelectedView('recommended'); else if (label === 'Alla övningar') setSelectedView('all'); else if (label === 'Mina') setSelectedView('mine'); }} />
      </View>

      {selectedView === 'recommended' ? <View style={styles.viewBody} testID="training-recommended-view">
        <View style={styles.recommendationHeading}>
          <Text style={styles.sectionTitle}>{ageWeeks === null ? 'Rekommenderat för er' : `Passar just nu (${ageWeeks} ${ageWeeks === 1 ? 'vecka' : 'veckor'})`}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Visa alla träningsövningar" onPress={() => setSelectedView('all')} style={styles.showAllTarget}>
            <Text style={styles.showAll}>Visa alla</Text>
          </Pressable>
        </View>
        {ageWeeks === null ? <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Lägg till hundens födelsedatum</Text>
          <Text style={styles.body}>Då kan vi visa vilka publicerade program som passar åldern.</Text>
          {onAddBirthDate ? <Button variant="secondary" label="Lägg till födelsedatum" accessibilityLabel="Lägg till födelsedatum" onPress={onAddBirthDate} /> : null}
        </View> : ageMatchedPrograms.length > 0 ? <View style={[styles.recommendationGrid, stackRecommendations && styles.recommendationGridStacked]}>
          {ageMatchedPrograms.slice(0, 2).map((program, index) => {
            const next = pickNextExercise([program]);
            const step = next && program.steps.find((candidate) => candidate.id === next.stepId);
            if (!next || !step) return null;
            const source = index === 0
              ? require('../../../assets/images/training-hero-shiba-park.jpg')
              : require('../../../assets/images/training-recommendation-puppy-black-tan-park.jpg');
            return <View key={program.id} style={styles.recommendationCell}>
              <Card variant="home" onPress={() => setSelection({ programId: program.id, stepId: step.id })}
                accessibilityLabel={`Öppna nästa övning ${step.title} i ${program.title}`}>
                <View style={styles.recommendationCard}>
                  <View style={styles.recommendationImageFrame}>
                    <Image source={source} style={styles.recommendationImage} resizeMode="cover" accessible={false} accessibilityElementsHidden importantForAccessibility="no" />
                  </View>
                  <View style={[styles.recommendationCopy, { minHeight: currentRecommendationCopyHeight }]}
                    onLayout={(event) => recordRecommendationCopyHeight(event.nativeEvent.layout.height)}>
                    <Text style={styles.recommendationProgramTitle} testID="training-recommendation-program-title">{program.title}</Text>
                    <Text style={styles.recommendationTitle} testID="training-recommendation-step-title">{step.title}</Text>
                  </View>
                </View>
              </Card>
            </View>;
          })}
        </View> : <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{allComplete ? 'Ni har gått igenom allt just nu' : 'Inga övningar tillgängliga ännu'}</Text>
          <Text style={styles.body}>{allComplete
            ? 'Sparade övningar finns under Mina. Nya rekommendationer visas när publicerade program passar åldern.'
            : 'Nya rekommendationer visas när publicerade program finns för hundens ålder.'}</Text>
          {onOpenKnowledge ? <Button variant="tertiary" label="Öppna Kunskap" accessibilityLabel="Öppna Kunskap" onPress={onOpenKnowledge} /> : null}
        </View>}

        {continuationProgram && continuationStep && nextExercise ? <View style={styles.continuationSection}>
          <SectionHeader title="Fortsätt där ni var" />
          <Card variant="home" onPress={() => setSelection({ programId: continuationProgram.id, stepId: continuationStep.id })}
            accessibilityLabel={`Fortsätt ${continuationProgram.title}, nästa övning ${continuationStep.title}, ${exerciseProgressLabel(continuationProgram)}`}>
            <View style={styles.continuationCard}>
              <Image source={require('../../../assets/images/training-next-step-puppy-corgi-home.jpg')} style={styles.nextImage} resizeMode="cover" accessible={false} accessibilityElementsHidden importantForAccessibility="no" />
              <View style={styles.nextCopy}>
                <Text style={styles.programTitle}>{continuationProgram.title}</Text>
                <Text style={styles.recommendationTitle}>{continuationStep.title}</Text>
                <Progress value={percentage(continuationProgram)} label={exerciseProgressLabel(continuationProgram)} />
              </View>
            </View>
          </Card>
        </View> : null}
      </View> : null}

      {selectedView === 'all' ? <View style={styles.viewBody} testID="training-all-view">
        <SectionHeader title="Alla övningar" />
        <Text style={styles.body}>Publicerade program som är tillgängliga för hunden och versioner ni redan har börjat.</Text>
        {visiblePrograms.length === 0 ? <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Inga övningar tillgängliga ännu</Text>
          <Text style={styles.body}>Program visas här när de finns publicerade för hunden.</Text>
        </View> : <View style={styles.programList}>{sortedPrograms.map((program) => {
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
        })}</View>}
      </View> : null}

      {selectedView === 'mine' ? <View style={styles.viewBody} testID="training-mine-view">
        <SectionHeader title="Mina program" />
        <Text style={styles.body}>Här samlas övningar som ni har markerat som genomförda.</Text>
        {paused.filter((item) => item.title !== null).map((item) => <View key={item.versionId} style={styles.pausedCard}>
          <Text style={styles.programTitle}>{item.title}{item.versionNumber === null ? '' : ` · version ${item.versionNumber}`} · pausad</Text>
          <Text style={styles.note}>{item.completedCount === 1 ? '1 genomförd övning finns kvar.' : `${item.completedCount} genomförda övningar finns kvar.`}</Text>
        </View>)}
        {paused.some((item) => item.title === null) ? <View style={styles.pausedCard} testID="training-unavailable-progress">
          <Text style={styles.programTitle}>Tidigare program</Text>
          <Text style={styles.note}>{paused.filter((item) => item.title === null).length === 1
            ? 'Ett tidigare program är inte längre tillgängligt. Sparade markeringar finns kvar.'
            : `${paused.filter((item) => item.title === null).length} tidigare program är inte längre tillgängliga. Sparade markeringar finns kvar.`}</Text>
        </View> : null}
        {minePrograms.length === 0 && paused.length === 0 ? <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Ni har inte markerat någon övning ännu</Text>
          <Text style={styles.body}>När ni markerar en övning som genomförd sparas programmet här.</Text>
          <Button variant="tertiary" label="Utforska övningar" accessibilityLabel="Utforska övningar" onPress={() => setSelectedView('all')} />
        </View> : minePrograms.length > 0 ? <View style={styles.programList}>{minePrograms.map((program) => {
          const status = programStatus(program);
          const word = programStatusWord(status);
          const progressLabel = exerciseProgressLabel(program);
          return <Card key={program.id} onPress={() => { setResetTarget(null); setOpenProgramId(program.id); }} accessibilityLabel={`${program.title}, ${word}, ${progressLabel}. Öppna programmet`}>
            <View style={styles.programInner}>
              <View style={styles.programHeader}>
                <Text style={styles.programTitle}>{program.title}</Text>
                <Text style={styles.programStatus}>{word}</Text>
              </View>
              <Progress value={percentage(program)} label={progressLabel} />
            </View>
          </Card>;
        })}</View> : null}
      </View> : null}
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
    <Dialog visible={Boolean(resetTarget && resetTargetIsCurrent)} title={resetTarget ? `Börja om med ${resetTarget.program.title}?` : 'Börja om?'}
      onRequestClose={() => setResetTarget(null)} onConfirm={confirmReset} confirmLabel="Börja om" confirmVariant="destructive" cancelLabel="Avbryt" compactActions>
      <Text style={styles.resetDialogBody}>Markeringarna i det här programmet tas bort. Du får ett meddelande om allt inte går att rensa.</Text>
    </Dialog>
  </View>;
}

function percentage(program: PublishedTrainingProgram) { return program.steps.length ? completedCount(program) / program.steps.length * 100 : 0; }
function programResetFingerprint(program: PublishedTrainingProgram) {
  return JSON.stringify({ id: program.id, content_id: program.content_id, version: program.version, title: program.title,
    body: program.body, sources: program.sources, completedStepIds: program.completedStepIds,
    completedAtByStepId: program.completedAtByStepId,
    steps: program.steps.map(({ id, position, title, instruction }) => ({ id, position, title, instruction })),
    currentAgeBreedMatch: program.currentAgeBreedMatch, is_ai_generated: program.is_ai_generated });
}
function formatHistoricalDate(dateKey?: string): string {
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return 'Sparad dag';
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  return new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date);
}

const styles = StyleSheet.create({
  focusedPage: { gap: tokens.spacing.md, paddingBottom: tokens.spacing.xl },
  focusedCard: { padding: tokens.spacing.lg, gap: tokens.spacing.sm, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.training.continueSurface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  screenTitle: { ...tokens.typography.title, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md },
  programActions: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, marginTop: tokens.spacing.xs },
  programInfoAction: { flex: 1, minWidth: 0, minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.xs, borderRadius: tokens.radius.md },
  programInfoLabel: { ...tokens.typography.caption, color: tokens.colors.training.accent, fontWeight: '700', flexShrink: 1 },
  resetIconAction: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  disabledAction: { opacity: 0.5 },
  resetDialogBody: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  pressed: { opacity: 0.75 },
  viewBody: { gap: tokens.spacing.md },
  recommendationHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  sectionTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, flexShrink: 1 },
  showAllTarget: { minHeight: tokens.size.touchMin, minWidth: tokens.size.touchMin, justifyContent: 'center', alignItems: 'flex-end', paddingLeft: tokens.spacing.sm },
  showAll: { ...tokens.typography.caption, color: tokens.colors.training.accent, fontWeight: '700' },
  recommendationGrid: { flexDirection: 'row', gap: tokens.spacing.md, alignItems: 'stretch' },
  recommendationGridStacked: { flexDirection: 'column' },
  recommendationCell: { flex: 1, minWidth: 0 },
  recommendationCard: { gap: tokens.spacing.sm },
  recommendationImageFrame: { width: '100%', aspectRatio: 4 / 3, borderRadius: tokens.radius.md, overflow: 'hidden', backgroundColor: tokens.colors.training.card },
  recommendationImage: { width: '100%', height: '100%' },
  recommendationCopy: { gap: tokens.spacing.xs },
  recommendationProgramTitle: { ...tokens.typography.smallCaption, color: tokens.colors.textSecondary },
  recommendationTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  continuationSection: { marginTop: tokens.spacing.md },
  continuationCard: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  path: { gap: tokens.spacing.xs },
  currentStep: { padding: tokens.spacing.lg, gap: tokens.spacing.sm, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke * 2, borderColor: tokens.colors.primary },
  nextImage: { width: tokens.size.trainingImage, height: tokens.size.trainingImage, borderRadius: tokens.radius.md, flexShrink: 0 },
  nextCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.sm },
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
