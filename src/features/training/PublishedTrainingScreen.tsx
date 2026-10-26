import { startTransition, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppBar, BottomSheet, Button, Card, Dialog, ListRow, Progress, SectionHeader, Tabs, Toast } from '../../components/ui';
import type { HistoricalTrainingStepDetail, PausedTrainingProgress, PublishedTrainingProgram } from '../../data/workspace-data';
import {
  emptyTrainingProgression,
  progressionForProgram,
  trainingProgressionPresentation,
  type PendingTrainingProgression,
  type TrainingProgressionAction,
  type TrainingProgressionWorkspace,
  type TrainingSessionFeedback,
} from './training-progression';
import { completeReviewTrainingStep, completeTrainingStepForMode, isReviewTrainingProgram, resetReviewTrainingProgram, unmarkReviewTrainingStep, unmarkTrainingStepForMode } from './review-training-state';
import { tokens } from '../../theme/tokens';
import { allProgramsComplete, completedCount, exerciseCountLabel, pickNextExercise, programStatus, programStatusWord, programsWithProgress, recommendedPrograms, sortPrograms, stepStates } from './training-overview';

function exerciseProgressLabel(program: PublishedTrainingProgram): string {
  if (program.steps.length === 0) return '';
  return `Aktivitetsmarkeringar: ${completedCount(program)} av ${program.steps.length}`;
}

export function PublishedTrainingScreen({ ageWeeks, programs, paused, busyStepKey, error, onCompleteStep, onUnmarkStep, onContinue, onResetProgram, onRetry, onAddBirthDate, onOpenKnowledge, reviewMode = false, focusStep, historicalDetail, onCloseStep,
  progression = emptyTrainingProgression(), progressionState = 'error', pendingProgressions = {}, onApplyProgression, onRetryProgression, initialProgramId, onInitialProgramFocusApplied }: {
  ageWeeks: number | null; programs: readonly PublishedTrainingProgram[]; paused: readonly PausedTrainingProgress[]; busyStepKey: string | null; error: string;
  progression?: TrainingProgressionWorkspace;
  progressionState?: 'ready' | 'error';
  pendingProgressions?: Readonly<Record<string, PendingTrainingProgression>>;
  onApplyProgression?: (action: TrainingProgressionAction) => Promise<'saved' | 'failed' | 'unknown'>;
  onRetryProgression?: (programVersionId: string) => Promise<'saved' | 'failed' | 'unknown'>;
  initialProgramId?: string | null;
  onInitialProgramFocusApplied?: () => void;
  reviewMode?: boolean;
  focusStep?: { programId: string; stepId: string; returnPage: 'home' | 'checklist' | 'progress'; readOnly?: boolean; dateKey?: string; completed?: boolean };
  historicalDetail?: { status: 'loading' | 'ready' | 'partial' | 'unavailable'; detail: HistoricalTrainingStepDetail | null };
  onCloseStep?: () => void;
  onCompleteStep: (program: PublishedTrainingProgram, stepId: string) => Promise<{ programId: string; stepId: string } | false>;
  onUnmarkStep?: (program: PublishedTrainingProgram, stepId: string) => Promise<{ programId: string; stepId: string } | false>; onContinue: () => void;
  onResetProgram: (program: PublishedTrainingProgram) => void; onRetry: () => void;
  onAddBirthDate?: () => void; onOpenKnowledge?: () => void;
}) {
  const [openProgramId, setOpenProgramId] = useState<string | null>(() => initialProgramId ?? null);
  const [selection, setSelection] = useState<{ programId: string; stepId: string } | null>(null);
  const [selectedView, setSelectedView] = useState<'recommended' | 'all' | 'mine'>('recommended');
  const [legacyActivityOpen, setLegacyActivityOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [progressionMessage, setProgressionMessage] = useState<{ programId: string; message: string } | null>(null);
  const [awaitingProgressionRefresh, setAwaitingProgressionRefresh] = useState<{ programId: string; fingerprint: string } | null>(null);
  const selectionKey = `${openProgramId ?? ''}:${selection?.programId ?? ''}:${selection?.stepId ?? ''}`;
  const [feedbackDraftState, setFeedbackDraftState] = useState<{ key: string; value: TrainingSessionFeedback | null }>({ key: '', value: null });
  const [feedbackPickerState, setFeedbackPickerState] = useState<{ key: string; value: boolean }>({ key: '', value: false });
  const feedbackDraft = feedbackDraftState.key === selectionKey ? feedbackDraftState.value : null;
  const feedbackPickerOpen = feedbackPickerState.key === selectionKey && feedbackPickerState.value;
  const setFeedbackDraft = useCallback((value: TrainingSessionFeedback | null) => setFeedbackDraftState({ key: selectionKey, value }), [selectionKey]);
  const setFeedbackPickerOpen = useCallback((value: boolean) => setFeedbackPickerState({ key: selectionKey, value }), [selectionKey]);
  const [reviewCompleted, setReviewCompleted] = useState<Record<string, string[]>>({});
  const [resetTarget, setResetTarget] = useState<{ program: PublishedTrainingProgram; fingerprint: string } | null>(null);
  const [recommendationCopyHeight, setRecommendationCopyHeight] = useState<{ key: string; height: number } | null>(null);
  const [animateCompleteTarget, setAnimateCompleteTarget] = useState<{ key: string; programId: string; stepId: string } | null>(null);
  const animationSequence = useRef(0);
  const resetFlight = useRef<{ programId: string; sawBusy: boolean } | null>(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  const progressionRef = useRef(progression);
  const pendingProgressionsRef = useRef(pendingProgressions);
  const visiblePrograms = reviewMode ? programs.map((program) => ({ ...program, currentAgeBreedMatch: true, completedStepIds: reviewCompleted[program.id] ?? program.completedStepIds })) : programs;
  const openProgram = visiblePrograms.find((program) => program.id === openProgramId) ?? null;
  const currentResetProgram = resetTarget ? visiblePrograms.find((program) => program.id === resetTarget.program.id) : null;
  const resetTargetIsCurrent = Boolean(resetTarget && !focusStep && currentResetProgram && openProgramId === resetTarget.program.id
    && programResetFingerprint(currentResetProgram) === resetTarget.fingerprint);
  if (resetTarget && !resetTargetIsCurrent) setResetTarget(null);
  const selectedProgram = visiblePrograms.find((program) => program.id === (focusStep?.programId ?? selection?.programId));
  const selectedStep = selectedProgram?.steps.find((step) => step.id === (focusStep?.stepId ?? selection?.stepId));
  const waitingForSelectedRefresh = Boolean(selectedProgram && awaitingProgressionRefresh?.programId === selectedProgram.id
    && awaitingProgressionRefresh.fingerprint === progressionFingerprint(progression, selectedProgram.id));
  const nextStep = selectedProgram?.steps.find((step) => !selectedProgram.completedStepIds.includes(step.id));
  const journeyProgramIds = new Set(progression.journeys.map((journey) => journey.program_version_id));
  const sortedPrograms = sortPrograms(visiblePrograms);
  const ageMatchedPrograms = recommendedPrograms(visiblePrograms).filter((program) => !journeyProgramIds.has(program.id));
  const minePrograms = sortPrograms([...new Map([...programsWithProgress(visiblePrograms), ...visiblePrograms.filter((program) => journeyProgramIds.has(program.id))]
    .map((program) => [program.id, program])).values()]);
  const nextExercise = pickNextExercise(sortedPrograms);
  const allComplete = allProgramsComplete(visiblePrograms);
  const heroProgram = nextExercise ? visiblePrograms.find((program) => program.id === nextExercise.programId) : undefined;
  const latestJourney = progressionState === 'ready' ? [...progression.journeys].sort((left, right) =>
    right.updated_at.localeCompare(left.updated_at) || left.program_version_id.localeCompare(right.program_version_id) || left.id.localeCompare(right.id))[0] : null;
  const journeyContinuationProgram = latestJourney ? visiblePrograms.find((program) => program.id === latestJourney.program_version_id) : undefined;
  const journeyContinuationStep = journeyContinuationProgram?.steps.find((step) => step.id === latestJourney?.active_step_id);
  const continuationProgram = journeyContinuationStep ? journeyContinuationProgram : nextExercise?.kind === 'continue' ? heroProgram : undefined;
  const continuationStep = journeyContinuationStep ?? continuationProgram?.steps.find((step) => step.id === nextExercise?.stepId);
  const continuationJourney = latestJourney && journeyContinuationStep ? latestJourney : null;
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

  useLayoutEffect(() => {
    progressionRef.current = progression;
    pendingProgressionsRef.current = pendingProgressions;
  }, [pendingProgressions, progression]);

  useEffect(() => {
    const waiting = awaitingProgressionRefresh;
    if (!waiting || progressionState !== 'ready' || progressionFingerprint(progression, waiting.programId) === waiting.fingerprint) return;
    const journey = progressionForProgram(progression, waiting.programId).journey;
    const program = visiblePrograms.find((item) => item.id === waiting.programId);
    if (!journey || !program?.steps.some((step) => step.id === journey.active_step_id)) return;
    startTransition(() => {
      setOpenProgramId(waiting.programId);
      setSelection({ programId: waiting.programId, stepId: journey.active_step_id });
      setAwaitingProgressionRefresh(null);
    });
  }, [awaitingProgressionRefresh, progression, progressionState, visiblePrograms]);

  useEffect(() => {
    if (!initialProgramId) return;
    const timeout = setTimeout(() => onInitialProgramFocusApplied?.(), 0);
    return () => clearTimeout(timeout);
  }, [initialProgramId, onInitialProgramFocusApplied, visiblePrograms]);

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
  const submitProgressionAction = useCallback(async (programId: string, action: TrainingProgressionAction, confirmation: string) => {
    if (!onApplyProgression) return;
    const awaitRefresh = action.kind === 'start_or_resume' || action.kind === 'next' || action.kind === 'back';
    const previousFingerprint = awaitRefresh ? progressionFingerprint(progressionRef.current, programId) : '';
    setAwaitingProgressionRefresh(null);
    const outcome = await onApplyProgression(action);
    if (!mounted.current) return;
    if (outcome === 'saved') {
      setProgressionMessage(null);
      if (awaitRefresh && progressionFingerprint(progressionRef.current, programId) === previousFingerprint) {
        setAwaitingProgressionRefresh({ programId, fingerprint: previousFingerprint });
      }
      setSuccessMessage(confirmation);
      if (action.kind === 'record_session') {
        setFeedbackDraft(null);
        setFeedbackPickerOpen(false);
      }
    } else {
      setProgressionMessage({
        programId,
        message: outcome === 'unknown'
          ? 'Vi kunde inte bekräfta om ändringen sparades. Kontrollera samma ändring igen.'
          : 'Ändringen kunde inte sparas. Försök igen.',
      });
    }
  }, [onApplyProgression, progressionRef, setFeedbackDraft, setFeedbackPickerOpen, setSuccessMessage, setProgressionMessage]);

  const retryProgression = useCallback(async (programId: string) => {
    if (!onRetryProgression) return;
    const action = pendingProgressionsRef.current[programId]?.action;
    const awaitRefresh = action?.kind === 'start_or_resume' || action?.kind === 'next' || action?.kind === 'back';
    const previousFingerprint = awaitRefresh ? progressionFingerprint(progressionRef.current, programId) : '';
    const outcome = await onRetryProgression(programId);
    if (!mounted.current) return;
    if (outcome === 'saved') {
      setProgressionMessage(null);
      if (awaitRefresh && progressionFingerprint(progressionRef.current, programId) === previousFingerprint) {
        setAwaitingProgressionRefresh({ programId, fingerprint: previousFingerprint });
      }
      setSuccessMessage('Träningsresan är uppdaterad.');
      setFeedbackDraft(null);
      setFeedbackPickerOpen(false);
    } else {
      setProgressionMessage({
        programId,
        message: outcome === 'unknown'
          ? 'Vi kunde fortfarande inte kontrollera ändringen. Försök igen när anslutningen fungerar.'
          : 'Ändringen kunde inte verifieras. Läs in Träning igen.',
      });
    }
  }, [onRetryProgression, pendingProgressionsRef, progressionRef, setFeedbackDraft, setFeedbackPickerOpen, setSuccessMessage, setProgressionMessage]);

  function renderJourneyOverview(program: PublishedTrainingProgram) {
    if (reviewMode && isReviewTrainingProgram(program.id)) return null;
    const view = trainingProgressionPresentation(progression, program.id, program.steps);
    const pendingOperation = pendingProgressions[program.id];
    const busy = busyStepKey === `journey:${program.id}`;
    const waitingForRefresh = awaitingProgressionRefresh?.programId === program.id
      && awaitingProgressionRefresh.fingerprint === progressionFingerprint(progression, program.id);
    return <View style={styles.journeySection} testID={`training-journey-${program.id}`}>
{waitingForRefresh ? <View style={styles.emptyCard}><Text style={styles.body}>Ändringen är sparad. Hämtar det aktiva steget.</Text></View> : progressionState === 'error' ? <View style={styles.emptyCard}>
        <Text style={styles.body}>Träningsresan kunde inte hämtas just nu. Aktivitetsmarkeringarna finns kvar.</Text>
        <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta träningsresan igen" onPress={onRetry} />
      </View> : pendingOperation?.status === 'unknown' ? <View style={styles.emptyCard}>
        <Text style={styles.body}>{progressionMessage?.programId === program.id ? progressionMessage.message : 'Den senaste ändringen behöver kontrolleras innan ni fortsätter.'}</Text>
        <Button variant="secondary" label="Kontrollera samma ändring igen" accessibilityLabel="Kontrollera samma träningsändring igen" loading={busy}
          disabled={Boolean(busyStepKey)} onPress={() => { void retryProgression(program.id); }} />
      </View> : !view.journey ? <View style={styles.journeyCard}>
        <Text style={styles.note}>Loggade pass och delmål bedömda av dig sparas separat.</Text>
        <Button label="Starta träningsresa" accessibilityLabel={`Starta träningsresa för ${program.title}`} loading={busy}
          disabled={Boolean(busyStepKey) || !view.canStartOrResume || !onApplyProgression}
          onPress={() => { void submitProgressionAction(program.id, { kind: 'start_or_resume', programVersionId: program.id }, 'Träningsresan är startad.'); }} />
      </View> : !view.activeStepId || !view.activeStepTitle ? <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>Övningen är inte tillgänglig</Text>
        <Text style={styles.body}>Den sparade träningsresan finns kvar, men det publicerade programmet kan inte öppnas just nu.</Text>
      </View> : <View style={styles.journeyCard}>
        <Text style={styles.stepMeta}>{view.stateLabel} · {program.title}</Text>
        <Text style={styles.programTitle}>{view.activeStepTitle}</Text>
        <Text style={styles.stepMeta}>{view.loggedSessions} Tränat · {view.confirmedMilestones} delmål</Text>
        {view.canStartOrResume ? <Button label="Återuppta träningsresan" accessibilityLabel={`Återuppta träningsresan för ${program.title}`} loading={busy}
          disabled={Boolean(busyStepKey) || !onApplyProgression}
          onPress={() => { void submitProgressionAction(program.id, { kind: 'start_or_resume', programVersionId: program.id }, 'Träningsresan är återupptagen.'); }} /> : <Button label="Öva på aktivt steg" accessibilityLabel={`Öva på ${view.activeStepTitle}`} variant="secondary"
          disabled={Boolean(busyStepKey)} onPress={() => setSelection({ programId: program.id, stepId: view.activeStepId! })} />}
        {view.canPause ? <View style={styles.journeyActions}>
          <Button variant="tertiary" compact label="Pausa" accessibilityLabel="Pausa träningsresan" disabled={Boolean(busyStepKey) || !onApplyProgression}
            onPress={() => { void submitProgressionAction(program.id, { kind: 'pause', programVersionId: program.id, stepId: view.activeStepId! }, 'Träningsresan är pausad.'); }} />
          {view.canSetMaintenance ? <Button variant="tertiary" compact label="Underhåll" accessibilityLabel="Sätt träningsresan i underhåll" disabled={Boolean(busyStepKey) || !onApplyProgression}
            onPress={() => { void submitProgressionAction(program.id, { kind: 'maintenance', programVersionId: program.id, stepId: view.activeStepId! }, 'Träningsresan är i underhåll.'); }} /> : null}
        </View> : null}
      </View>}
      {progressionMessage?.programId === program.id && pendingOperation?.status !== 'unknown' ? <Text style={styles.progressionMessage} accessibilityLiveRegion="polite">{progressionMessage.message}</Text> : null}
    </View>;
  }

  function legacyActivityButtonVariant(programVersionId: string): 'primary' | 'secondary' {
    return progressionState === 'ready' && progression.journeys.some((journey) => journey.program_version_id === programVersionId)
      ? 'secondary' : 'primary';
  }

  function renderJourneyExercise(program: PublishedTrainingProgram, stepId: string) {
    if (reviewMode && isReviewTrainingProgram(program.id)) return null;
    if (progressionState !== 'ready') return null;
    const view = trainingProgressionPresentation(progression, program.id, program.steps);
    if (!view.journey || view.activeStepId !== stepId || !view.canLogSession) return null;
    const pendingOperation = pendingProgressions[program.id];
    const busy = busyStepKey === `journey:${program.id}`;
    const waitingForRefresh = awaitingProgressionRefresh?.programId === program.id
      && awaitingProgressionRefresh.fingerprint === progressionFingerprint(progression, program.id);
    const sessionsForStep = progressionForProgram(progression, program.id).sessions.filter((session) => session.step_id === stepId).length;
    const milestone = view.currentStepConfirmed;
    return <View style={styles.journeySection} testID={`training-journey-step-${program.id}-${stepId}`}>
      <Text style={styles.stepMeta}>{view.loggedSessions} Tränat · {view.confirmedMilestones} delmål</Text>
      <Text style={styles.note}>Ett loggat pass blir inte automatiskt ett färdighetsmål. Du bedömer steget själv.</Text>
      {waitingForRefresh ? <View style={styles.emptyCard}><Text style={styles.body}>Ändringen är sparad. Hämtar det aktiva steget.</Text></View> : pendingOperation?.status === 'unknown' ? <View style={styles.emptyCard}>
        <Text style={styles.body}>{progressionMessage?.programId === program.id ? progressionMessage.message : 'Den senaste ändringen behöver kontrolleras innan ni fortsätter.'}</Text>
        <Button variant="secondary" label="Kontrollera samma ändring igen" accessibilityLabel="Kontrollera samma träningsändring igen" loading={busy}
          disabled={Boolean(busyStepKey)} onPress={() => { void retryProgression(program.id); }} />
      </View> : view.canLogSession ? <>
        {feedbackPickerOpen ? <View style={styles.feedbackChoices}>
          <Text style={styles.stepMeta}>Hur gick passet enligt dig?</Text>
          {([
            ['worked_as_planned', 'Vi kom dit vi tänkt oss.'],
            ['practice_more', 'Vi fortsätter öva.'],
            ['paused_early', 'Vi tog en paus.'],
          ] as const).map(([feedback, label]) => <Button key={feedback} variant={feedbackDraft === feedback ? 'secondary' : 'tertiary'} compact
            label={label} accessibilityLabel={label} disabled={Boolean(busyStepKey) || !onApplyProgression} onPress={() => setFeedbackDraft(feedback)} />)}
          <View style={styles.journeyActions}>
            <Button label="Spara återkoppling" accessibilityLabel="Spara återkopplingen för träningspasset" loading={busy}
              disabled={Boolean(busyStepKey) || !feedbackDraft}
              onPress={() => { if (feedbackDraft) void submitProgressionAction(program.id, { kind: 'record_session', programVersionId: program.id, stepId, feedback: feedbackDraft }, 'Träningspasset är loggat.'); }} />
            <Button variant="tertiary" compact label="Avbryt" accessibilityLabel="Avbryt återkopplingen" disabled={Boolean(busyStepKey)} onPress={() => { setFeedbackPickerOpen(false); setFeedbackDraft(null); }} />
          </View>
        </View> : <Button variant={milestone && view.canGoNext ? 'secondary' : 'primary'} label="Logga träningspass"
          accessibilityLabel={`Logga ett träningspass för ${selectedStep?.title ?? stepId}`} disabled={Boolean(busyStepKey) || !onApplyProgression} onPress={() => setFeedbackPickerOpen(true)} />}
        {!feedbackPickerOpen && view.canConfirmStep ? <View style={styles.milestonePrompt}>
          <Text style={styles.note}>När du själv bedömer att stegets instruktion är uppnådd kan du bekräfta delmålet.</Text>
          <Button variant="secondary" label="Bekräfta delmål" accessibilityLabel={`Bekräfta delmålet för ${selectedStep?.title ?? stepId}`} loading={busy}
            disabled={Boolean(busyStepKey) || !onApplyProgression}
            onPress={() => { void submitProgressionAction(program.id, { kind: 'confirm_step', programVersionId: program.id, stepId }, 'Delmålet är bekräftat av dig.'); }} />
        </View> : !feedbackPickerOpen && milestone ? <Text style={styles.confirmedMilestone}>Delmålet är bekräftat av dig.</Text>
          : !feedbackPickerOpen && sessionsForStep === 0 ? <Text style={styles.stepMeta}>Efter ett loggat pass kan du själv bekräfta delmålet.</Text> : null}
        {!feedbackPickerOpen ? <View style={styles.journeyActions}>
          {view.canGoBack ? <Button variant="tertiary" compact label="Backa" accessibilityLabel="Backa till föregående träningssteg" disabled={Boolean(busyStepKey) || !onApplyProgression}
            onPress={() => { void submitProgressionAction(program.id, { kind: 'back', programVersionId: program.id, stepId }, 'Ni är tillbaka på föregående steg.'); }} /> : null}
          <Button variant="tertiary" compact label="Upprepa" accessibilityLabel="Upprepa samma träningssteg" disabled={Boolean(busyStepKey) || !onApplyProgression}
            onPress={() => { void submitProgressionAction(program.id, { kind: 'repeat', programVersionId: program.id, stepId }, 'Ni fortsätter på samma steg.'); }} />
          {view.canGoNext ? <Button label="Fortsätt till nästa steg" accessibilityLabel="Fortsätt till nästa träningssteg" loading={busy}
            disabled={Boolean(busyStepKey) || !onApplyProgression}
            onPress={() => { void submitProgressionAction(program.id, { kind: 'next', programVersionId: program.id, stepId }, 'Nästa steg är sparat.'); }} /> : null}
        </View> : null}
      </> : <View style={styles.emptyCard}>
        <Text style={styles.body}>Träningsresan är pausad. Återuppta den i programöversikten innan nästa pass.</Text>
      </View>}
    </View>;
  }

  function stepRows(program: PublishedTrainingProgram) {
    const states = stepStates(program);
    const journeyView = progressionState === 'ready' ? trainingProgressionPresentation(progression, program.id, program.steps) : null;
    const journeyIndex = journeyView?.activeStepId ? program.steps.findIndex((step) => step.id === journeyView.activeStepId) : -1;
    const currentIndex = journeyIndex >= 0 ? journeyIndex : states.indexOf('current');
    const confirmedJourneySteps = new Set(journeyView?.journey
      ? progressionForProgram(progression, program.id).milestones.map((milestone) => milestone.step_id) : []);
    return <View style={styles.path}>{program.steps.map((step, index) => {
      const state = journeyIndex >= 0 ? index === journeyIndex ? 'current' : confirmedJourneySteps.has(step.id) ? 'done' : 'upcoming'
        : index === currentIndex ? 'current' : states[index];
      const legacyActivityMarked = program.completedStepIds.includes(step.id);
      if (state === 'current') return <View key={step.id} style={styles.currentStep}>
        <Text style={styles.stepMeta} testID={journeyIndex >= 0 ? 'training-active-journey-step' : undefined}>{journeyIndex >= 0 ? 'Aktivt steg i träningsresan' : 'Nästa övning'}</Text>
        <Text style={styles.stepMeta}>{`Övning ${index + 1} av ${program.steps.length}`}</Text>
        <Text style={styles.sheetHeading}>{step.title}</Text>
        <Text style={styles.body} numberOfLines={3}>{step.instruction}</Text>
        <Button variant={journeyView?.journey && journeyView.journey.state !== 'paused' && selection?.programId !== program.id ? 'primary' : 'secondary'}
          label="Öva nu" accessibilityLabel={`Nästa övning: ${step.title}, övning ${index + 1} av ${program.steps.length}`} onPress={() => setSelection({ programId: program.id, stepId: step.id })} />
      </View>;
      return <ListRow key={step.id} category="training" title={step.title} titleSize="compact"
        meta={confirmedJourneySteps.has(step.id)
          ? legacyActivityMarked ? 'Delmål bekräftat · aktivitet markerad' : 'Delmål bekräftat av dig'
          : legacyActivityMarked ? 'Aktivitet markerad' : journeyIndex >= 0 && index < journeyIndex ? 'Tidigare steg' : `Kommande · efter övning ${currentIndex + 1}`}
        accessibilityLabel={confirmedJourneySteps.has(step.id)
          ? `Delmål bekräftat: ${step.title}${legacyActivityMarked ? ', aktivitet markerad' : ''}`
          : legacyActivityMarked ? `Aktivitet markerad: ${step.title}` : journeyIndex >= 0 && index < journeyIndex ? `Tidigare steg: ${step.title}` : `Kommande övning: ${step.title}, kommer efter övning ${currentIndex + 1}`}
        complete={state === 'done' || confirmedJourneySteps.has(step.id)} animateCompleteKey={animateCompleteTarget?.programId === program.id && animateCompleteTarget.stepId === step.id ? animateCompleteTarget.key : undefined} onCompleteAnimationStart={consumeCompletionAnimation}
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
        <Text style={styles.note}>Aktiviteten är markerad. Färdighet bedömer du separat i träningsresan.</Text>
        {onUnmarkStep || (reviewMode && isReviewTrainingProgram(selectedProgram.id)) ? <Button variant="tertiary" label="Avmarkera" accessibilityLabel={`Avmarkera ${selectedStep.title}`} loading={busyStepKey === `${selectedProgram.id}:${selectedStep.id}:unmark`} disabled={Boolean(busyStepKey)} onPress={() => { void unmark(); }} /> : null}
      </> : <>
        {nextStep?.id !== selectedStep.id ? <Text style={styles.note}>Börja med {nextStep?.title} innan du markerar den här övningen.</Text> : null}
      <Button variant={legacyActivityButtonVariant(selectedProgram.id)} label="Logga utförd aktivitet" accessibilityLabel={`Logga utförd träningsaktivitet: ${selectedStep.title}`} loading={busyStepKey === `${selectedProgram.id}:${selectedStep.id}`} disabled={Boolean(busyStepKey) || nextStep?.id !== selectedStep.id} onPress={() => { void complete(); }} />
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
      {renderJourneyOverview(openProgram)}
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

        {continuationProgram && continuationStep && (continuationJourney || nextExercise?.kind === 'continue') ? <View style={styles.continuationSection}>
          <SectionHeader title="Fortsätt där ni var" />
          <Card variant="home" onPress={() => continuationJourney?.state === 'paused'
            ? setOpenProgramId(continuationProgram.id) : setSelection({ programId: continuationProgram.id, stepId: continuationStep.id })}
            accessibilityLabel={continuationJourney
              ? `Fortsätt träningsresan ${continuationProgram.title}, aktivt steg ${continuationStep.title}`
              : `Fortsätt ${continuationProgram.title}, nästa övning ${continuationStep.title}, ${exerciseProgressLabel(continuationProgram)}`}>
            <View style={styles.continuationCard}>
              <Image source={require('../../../assets/images/training-next-step-puppy-corgi-home.jpg')} style={styles.nextImage} resizeMode="cover" accessible={false} accessibilityElementsHidden importantForAccessibility="no" />
              <View style={styles.nextCopy}>
                <Text style={styles.programTitle}>{continuationProgram.title}</Text>
                <Text style={styles.recommendationTitle}>{continuationStep.title}</Text>
                {continuationJourney ? <Text style={styles.stepMeta}>{trainingProgressionPresentation(progression, continuationProgram.id, continuationProgram.steps).loggedSessions} loggade pass · {trainingProgressionPresentation(progression, continuationProgram.id, continuationProgram.steps).confirmedMilestones} delmål bekräftade av dig</Text>
                  : <Progress value={percentage(continuationProgram)} label={exerciseProgressLabel(continuationProgram)} />}
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
          const journey = progressionState === 'ready' ? progression.journeys.find((row) => row.program_version_id === program.id) : null;
          const word = journey ? trainingJourneyStateLabel(journey.state) : programStatusWord(status);
          const journeyProgress = journey ? trainingProgressionPresentation(progression, program.id, program.steps) : null;
          const progressLabel = journeyProgress ? `${journeyProgress.loggedSessions} Tränat · ${journeyProgress.confirmedMilestones} delmål` : exerciseProgressLabel(program);
          return <Card key={program.id} onPress={() => setOpenProgramId(program.id)} accessibilityLabel={`${program.title}, ${word}, ${progressLabel}. Öppna programmet`}>
            <View style={styles.programInner}>
              <View style={styles.programHeader}>
                <Text style={styles.programTitle}>{program.title}</Text>
                <Text style={styles.programStatus}>{word}</Text>
              </View>
              <Text style={styles.stepMeta}>{exerciseCountLabel(program.steps.length)}</Text>
              {journeyProgress ? <Text style={styles.stepMeta}>{progressLabel}</Text> : <Progress value={percentage(program)} label={progressLabel} />}
            </View>
          </Card>;
        })}</View>}
      </View> : null}

      {selectedView === 'mine' ? <View style={styles.viewBody} testID="training-mine-view">
        <SectionHeader title="Mina program" />
        <Text style={styles.body}>Här samlas program som ni har markerat eller startat en träningsresa i.</Text>
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
          <Text style={styles.emptyTitle}>Inga sparade träningsresor eller aktivitetsmarkeringar ännu</Text>
          <Text style={styles.body}>Starta en resa eller markera en aktivitet så hittar du programmet här.</Text>
          <Button variant="tertiary" label="Utforska övningar" accessibilityLabel="Utforska övningar" onPress={() => setSelectedView('all')} />
        </View> : minePrograms.length > 0 ? <View style={styles.programList}>{minePrograms.map((program) => {
          const status = programStatus(program);
          const journey = progressionState === 'ready' ? progression.journeys.find((row) => row.program_version_id === program.id) : null;
          const word = journey ? trainingJourneyStateLabel(journey.state) : programStatusWord(status);
          const journeyProgress = journey ? trainingProgressionPresentation(progression, program.id, program.steps) : null;
          const progressLabel = journeyProgress ? `${journeyProgress.loggedSessions} Tränat · ${journeyProgress.confirmedMilestones} delmål` : exerciseProgressLabel(program);
          return <Card key={program.id} onPress={() => { setResetTarget(null); setOpenProgramId(program.id); }} accessibilityLabel={`${program.title}, ${word}, ${progressLabel}. Öppna programmet`}>
            <View style={styles.programInner}>
              <View style={styles.programHeader}>
                <Text style={styles.programTitle}>{program.title}</Text>
                <Text style={styles.programStatus}>{word}</Text>
              </View>
              {journeyProgress ? <Text style={styles.stepMeta}>{progressLabel}</Text> : <Progress value={percentage(program)} label={progressLabel} />}
            </View>
          </Card>;
        })}</View> : null}
      </View> : null}
    </>}

    <BottomSheet visible={Boolean(selectedProgram)} title={waitingForSelectedRefresh ? 'Träning' : selectedStep ? 'Övning' : 'Om programmet'} onRequestClose={() => { if (!busyStepKey && !waitingForSelectedRefresh) setSelection(null); }}>
      {waitingForSelectedRefresh ? <View style={styles.emptyCard}><Text style={styles.body}>Ändringen är sparad. Hämtar det aktiva steget.</Text></View> : <>
      <Text style={styles.sheetHeading}>{selectedStep?.title ?? selectedProgram?.title}</Text>
      {selectedProgram?.is_ai_generated ? <Text style={styles.note}>AI-genererat innehåll</Text> : null}
      <Text style={styles.body}>{selectedStep?.instruction ?? selectedProgram?.body}</Text>
      <Text style={styles.note}>Anpassa efter din hund och pausa när det behövs.</Text>
      {!selectedStep ? <><SectionHeader title="Källor" />{selectedProgram?.sources.map((source) => <Text key={source} style={styles.note}>{source}</Text>)}</> : null}
      {selectedProgram && selectedStep && (progressionState !== 'ready' || !progression.journeys.some((journey) => journey.program_version_id === selectedProgram.id) || progression.journeys.find((journey) => journey.program_version_id === selectedProgram.id)?.state === 'paused') ? renderJourneyOverview(selectedProgram) : null}
      {selectedProgram && selectedStep ? renderJourneyExercise(selectedProgram, selectedStep.id) : null}
      {selectedStep ? <View style={styles.legacySection}>
        {selectedProgram?.completedStepIds.includes(selectedStep.id) ? <Text style={styles.stepMeta}>Aktiviteten är markerad.</Text> : nextStep?.id !== selectedStep.id ? <Text style={styles.note}>Börja med {nextStep?.title} innan du markerar den här övningen.</Text> : null}
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: legacyActivityOpen }} onPress={() => setLegacyActivityOpen((open) => !open)} style={styles.legacyDisclosure}>
          <Text style={styles.stepMeta}>Aktivitetsmarkeringar i programmet</Text><Ionicons name={legacyActivityOpen ? 'chevron-up' : 'chevron-down'} size={tokens.size.iconSm} color={tokens.colors.textSecondary} />
        </Pressable>
        {legacyActivityOpen ? selectedProgram?.completedStepIds.includes(selectedStep.id)
          ? onUnmarkStep || (reviewMode && isReviewTrainingProgram(selectedProgram.id)) ? <Button variant="tertiary" label="Avmarkera" accessibilityLabel={`Avmarkera ${selectedStep.title}`} loading={busyStepKey === `${selectedProgram.id}:${selectedStep.id}:unmark`} disabled={Boolean(busyStepKey)} onPress={() => { void unmark(); }} /> : null
          : <Button variant="tertiary" label="Logga utförd aktivitet" accessibilityLabel={`Logga utförd träningsaktivitet: ${selectedStep.title}`} loading={Boolean(busyStepKey)} disabled={Boolean(busyStepKey) || nextStep?.id !== selectedStep.id} onPress={() => { void complete(); }} /> : null}
      </View> : null}

      <Toast visible={Boolean(successMessage) && Boolean(selectedProgram)} tone="success" confirmed message={successMessage || undefined} autoDismissMs={2500} onAutoDismiss={() => setSuccessMessage('')} />
      <Toast visible={Boolean(error) && Boolean(selectedProgram)} tone="error" message={error || undefined} onRetry={onRetry} />
      </>}
    </BottomSheet>
    <Dialog visible={Boolean(resetTarget && resetTargetIsCurrent)} title={resetTarget ? `Börja om med ${resetTarget.program.title}?` : 'Börja om?'}
      onRequestClose={() => setResetTarget(null)} onConfirm={confirmReset} confirmLabel="Börja om" confirmVariant="destructive" cancelLabel="Avbryt" compactActions>
      <Text style={styles.resetDialogBody}>Markeringarna i det här programmet tas bort. Du får ett meddelande om allt inte går att rensa.</Text>
    </Dialog>
  </View>;
}

function progressionFingerprint(workspace: TrainingProgressionWorkspace, programId: string) {
  const selected = progressionForProgram(workspace, programId);
  return JSON.stringify({ journey: selected.journey, sessions: selected.sessions.map((row) => row.id), milestones: selected.milestones.map((row) => row.step_id).sort() });
}

function percentage(program: PublishedTrainingProgram) { return program.steps.length ? completedCount(program) / program.steps.length * 100 : 0; }
function trainingJourneyStateLabel(state: 'active' | 'paused' | 'maintenance') {
  return state === 'paused' ? 'Resan är pausad' : state === 'maintenance' ? 'Underhåll' : 'Träningsresa pågår';
}
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
  journeySection: { gap: tokens.spacing.sm },
  journeyCard: { padding: tokens.spacing.md, gap: tokens.spacing.sm, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.training.card, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  legacySection: { gap: tokens.spacing.xs },
  legacyDisclosure: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  journeyActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: tokens.spacing.xs },
  feedbackChoices: { gap: tokens.spacing.xs, padding: tokens.spacing.md, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  milestonePrompt: { gap: tokens.spacing.xs, paddingTop: tokens.spacing.sm },
  confirmedMilestone: { ...tokens.typography.caption, color: tokens.colors.training.accent, fontWeight: '700' },
  progressionMessage: { ...tokens.typography.caption, color: tokens.colors.danger },
});
