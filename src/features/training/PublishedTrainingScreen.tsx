import { startTransition, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { Animated, Image, Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppBar, BottomSheet, Button, Card, Dialog, Progress, SectionHeader, Tabs, Toast } from '../../components/ui';
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
import { useReducedMotion } from '../../components/ui/Motion';
import { allProgramsComplete, completedCount, exerciseCountLabel, pickNextExercise, programStatus, programStatusWord, programsWithProgress, recommendedPrograms, sortPrograms, stepStates } from './training-overview';
import { buildTrainingTimeline } from './training-timeline-model';
import { parseTrainingInstruction, trainingInstructionPreview } from './training-instruction';
import { getSafeContentSourceUrl } from '../knowledge/source-links';

function exerciseProgressLabel(program: PublishedTrainingProgram): string {
  if (program.steps.length === 0) return '';
  return `Aktivitetsmarkeringar: ${completedCount(program)} av ${program.steps.length}`;
}

function journeyStepProgressLabel(confirmed: number, total: number): string {
  return total > 0 ? `${confirmed} av ${total} delmål bekräftade` : 'Inga delmål';
}

function journeySessionCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'pass loggat' : 'pass loggade'}`;
}

function progressionRetrySuccessMessage(action: TrainingProgressionAction | undefined): string {
  switch (action?.kind) {
    case 'record_session': return 'Träningspasset är loggat.';
    case 'confirm_step': return 'Delmålet är bekräftat av dig.';
    case 'undo_step': return 'Bekräftelsen är ångrad.';
    case 'next': return 'Nästa steg är sparat.';
    case 'back': return 'Ni är tillbaka på föregående steg.';
    default: return 'Träningsresan är uppdaterad.';
  }
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
  const [sourceMessage, setSourceMessage] = useState('');
  const [progressionMessage, setProgressionMessage] = useState<{ programId: string; message: string } | null>(null);
  const [awaitingProgressionRefresh, setAwaitingProgressionRefresh] = useState<{ programId: string; fingerprint: string } | null>(null);
  const selectionKey = `${openProgramId ?? ''}:${selection?.programId ?? ''}:${selection?.stepId ?? ''}`;
  const [feedbackDraftState, setFeedbackDraftState] = useState<{ key: string; value: TrainingSessionFeedback | null }>({ key: '', value: null });
  const [feedbackPickerState, setFeedbackPickerState] = useState<{ key: string; value: boolean }>({ key: '', value: false });
  const feedbackDraft = feedbackDraftState.key === selectionKey ? feedbackDraftState.value : null;
  const feedbackPickerOpen = feedbackPickerState.key === selectionKey && feedbackPickerState.value;
  const setFeedbackDraft = useCallback((value: TrainingSessionFeedback | null) => setFeedbackDraftState({ key: selectionKey, value }), [selectionKey]);
  const setFeedbackPickerOpen = useCallback((value: boolean) => {
    if (value) setSuccessMessage('');
    setFeedbackPickerState({ key: selectionKey, value });
  }, [selectionKey]);
  const [reviewCompleted, setReviewCompleted] = useState<Record<string, string[]>>({});
  const [resetTarget, setResetTarget] = useState<{ program: PublishedTrainingProgram; fingerprint: string } | null>(null);
  const [recommendationCopyHeight, setRecommendationCopyHeight] = useState<{ key: string; height: number } | null>(null);
  const [journeyBannerWidth, setJourneyBannerWidth] = useState(0);
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
  const selectedJourneyView = selectedProgram && progressionState === 'ready'
    ? trainingProgressionPresentation(progression, selectedProgram.id, selectedProgram.steps) : null;
  const selectedJourneyData = selectedProgram && selectedJourneyView?.journey
    ? progressionForProgram(progression, selectedProgram.id) : null;
  const selectedConfirmedAt = Object.fromEntries((selectedJourneyData?.milestones ?? []).map((milestone) => [milestone.step_id, milestone.confirmed_at]));
  const selectedTimelineEntry = selectedProgram && selectedStep ? buildTrainingTimeline(
    selectedProgram.steps,
    selectedJourneyView?.activeStepId ?? selectedProgram.steps[stepStates(selectedProgram).indexOf('current')]?.id ?? null,
    selectedConfirmedAt,
    selectedProgram.completedAtByStepId,
    new Set(selectedProgram.completedStepIds),
    undefined,
    undefined,
    selectedJourneyView?.journey ? 'Aktivt steg' : 'Nästa övning',
  ).find((entry) => entry.step.id === selectedStep.id) : null;
  const selectedTimelineReadOnly = Boolean(selectedTimelineEntry && (
    selectedTimelineEntry.state === 'upcoming'
    || (selectedJourneyView?.journey && selectedTimelineEntry.state !== 'active')
  ));
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
      setSuccessMessage(progressionRetrySuccessMessage(action));
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
      <View style={styles.journeyBanner} testID="training-journey-banner" onLayout={(event) => {
        const width = Math.round(event.nativeEvent.layout.width);
        if (width > 0 && width !== journeyBannerWidth) setJourneyBannerWidth(width);
      }}>
        <Image source={require('../../../assets/images/training-recommendation-puppy-black-tan-park.jpg')}
          style={journeyBannerWidth > 0 ? [styles.journeyBannerImage, {
            width: journeyBannerWidth,
            height: journeyBannerWidth * 0.75,
            top: styles.journeyBanner.height / 2 - journeyBannerWidth * 0.75 * 0.36,
          }] : styles.journeyBannerImage}
          resizeMode="cover" accessible={false} accessibilityElementsHidden importantForAccessibility="no" />
      </View>
{waitingForRefresh ? <View style={styles.emptyCard}><Text style={styles.body}>Ändringen är sparad. Hämtar det aktiva steget.</Text></View> : progressionState === 'error' ? <View style={styles.emptyCard}>
        <Text style={styles.body}>Träningsresan kunde inte hämtas just nu. Aktivitetsmarkeringarna finns kvar.</Text>
        <Button variant="tertiary" label="Försök igen" accessibilityLabel="Hämta träningsresan igen" onPress={onRetry} />
      </View> : pendingOperation?.status === 'unknown' ? <View style={styles.emptyCard}>
        <Text style={styles.body}>{progressionMessage?.programId === program.id ? progressionMessage.message : 'Den senaste ändringen behöver kontrolleras innan ni fortsätter.'}</Text>
        <Button variant="secondary" label="Kontrollera samma ändring igen" accessibilityLabel="Kontrollera samma träningsändring igen" loading={busy}
          disabled={Boolean(busyStepKey)} onPress={() => { void retryProgression(program.id); }} />
      </View> : !view.journey ? <View style={styles.journeyCard}>
        <View style={styles.journeySummaryLine}><Ionicons name="navigate-circle-outline" size={tokens.size.iconMd} color={tokens.colors.training.accent} /><Text style={styles.journeySummaryText}>Börja med en övning i taget</Text></View>
        <Button label="Starta träningsresa" accessibilityLabel={`Starta träningsresa för ${program.title}`} loading={busy}
          disabled={Boolean(busyStepKey) || !view.canStartOrResume || !onApplyProgression}
          onPress={() => { void submitProgressionAction(program.id, { kind: 'start_or_resume', programVersionId: program.id }, 'Träningsresan är startad.'); }} />
      </View> : !view.activeStepId || !view.activeStepTitle ? <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>Övningen är inte tillgänglig</Text>
        <Text style={styles.body}>Den sparade träningsresan finns kvar, men det publicerade programmet kan inte öppnas just nu.</Text>
      </View> : <View style={styles.journeyCard}>
        <View style={styles.journeySummaryLine}>
          <Ionicons name={view.journey.state === 'paused' ? 'play-circle-outline' : 'navigate-circle-outline'} size={tokens.size.iconMd} color={tokens.colors.training.accent} />
          <Text style={styles.journeySummaryText}>{view.stateLabel} · {view.loggedSessions} pass · {view.confirmedMilestones} delmål</Text>
        </View>
        {view.canStartOrResume ? <>
          <Text style={styles.noteCompact}>Återupptas vid: {view.activeStepTitle}.</Text>
          <Button label="Fortsätt med nästa övning" accessibilityLabel={`Fortsätt med nästa övning i ${program.title}`} loading={busy}
            disabled={Boolean(busyStepKey) || !onApplyProgression}
            onPress={() => { void submitProgressionAction(program.id, { kind: 'start_or_resume', programVersionId: program.id }, 'Träningsresan är återupptagen.'); }} />
        </> : null}
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
    const currentProgression = progressionForProgram(progression, program.id);
    const sessionsForStep = currentProgression.sessions.filter((session) => session.step_id === stepId);
    const latestSessionForStep = sessionsForStep.slice().sort((left, right) => right.performed_at.localeCompare(left.performed_at)
      || right.id.localeCompare(left.id))[0];
    const lastPassWentWell = latestSessionForStep?.feedback === 'worked_as_planned';
    const currentMilestone = currentProgression.milestones.find((item) => item.step_id === stepId);
    const milestone = Boolean(currentMilestone);
    return <View style={styles.journeySection} testID={`training-journey-step-${program.id}-${stepId}`}>
      {waitingForRefresh ? <View style={styles.emptyCard}><Text style={styles.body}>Ändringen är sparad. Hämtar det aktiva steget.</Text></View> : pendingOperation?.status === 'unknown' ? <View style={styles.emptyCard}>
        <Text style={styles.body}>{progressionMessage?.programId === program.id ? progressionMessage.message : 'Den senaste ändringen behöver kontrolleras innan ni fortsätter.'}</Text>
        <Button variant="secondary" label="Kontrollera samma ändring igen" accessibilityLabel="Kontrollera samma träningsändring igen" loading={busy}
          disabled={Boolean(busyStepKey)} onPress={() => { void retryProgression(program.id); }} />
      </View> : view.canLogSession ? <>
        {feedbackPickerOpen ? <View style={styles.feedbackChoices} testID="training-session-feedback">
          <Text style={styles.feedbackHeading}>Hur gick passet?</Text>
          {([
            ['worked_as_planned', 'Gick som planerat', 'checkmark-circle-outline'],
            ['practice_more', 'Vi fortsätter öva', 'refresh-outline'],
            ['paused_early', 'Vi avslutade tidigare', 'stop-circle-outline'],
          ] as const).map(([feedback, label, icon]) => <Pressable key={feedback} accessibilityRole="radio"
            accessibilityState={{ checked: feedbackDraft === feedback, disabled: Boolean(busyStepKey) || !onApplyProgression }}
            accessibilityLabel={label} disabled={Boolean(busyStepKey) || !onApplyProgression}
            style={({ pressed }) => [styles.feedbackOption, feedbackDraft === feedback && styles.feedbackOptionSelected, pressed && styles.pressed]}
            onPress={() => setFeedbackDraft(feedback)}>
            <Ionicons name={icon} size={tokens.size.iconMd} color={feedbackDraft === feedback ? tokens.colors.training.accent : tokens.colors.textSecondary} />
            <Text style={styles.feedbackOptionText}>{label}</Text>
            {feedbackDraft === feedback ? <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.training.accent} /> : null}
          </Pressable>)}
          {progressionMessage?.programId === program.id ? <Text accessibilityLiveRegion="polite" style={styles.progressionMessage}>{progressionMessage.message}</Text> : null}
          <Button label="Spara pass" accessibilityLabel="Spara träningspass" loading={busy}
            disabled={Boolean(busyStepKey) || !feedbackDraft}
            onPress={() => { if (feedbackDraft) void submitProgressionAction(program.id, { kind: 'record_session', programVersionId: program.id, stepId, feedback: feedbackDraft }, 'Träningspasset är loggat.'); }} />
        </View> : lastPassWentWell && view.canConfirmStep ? <View style={styles.milestonePrompt} testID="training-milestone-ready">
          <View style={styles.milestonePromptHeading}>
            <Ionicons name="checkmark-circle-outline" size={tokens.size.iconMd} color={tokens.colors.training.accent} />
            <Text style={styles.milestoneTitle}>Redo att gå vidare?</Text>
          </View>
          <Text style={styles.noteCompact}>Bekräfta delmålet om övningens mål känns uppnått.</Text>
          <Button label="Bekräfta delmål" accessibilityLabel={`Bekräfta delmålet för ${selectedStep?.title ?? stepId}`} loading={busy}
            disabled={Boolean(busyStepKey) || !onApplyProgression}
            onPress={() => { void submitProgressionAction(program.id, { kind: 'confirm_step', programVersionId: program.id, stepId }, 'Delmålet är bekräftat av dig.'); }} />
          <Button variant="tertiary" compact label="Logga ett pass till" accessibilityLabel="Logga ett träningspass till för det här steget" disabled={Boolean(busyStepKey) || !onApplyProgression}
            onPress={() => { setFeedbackDraft(null); setFeedbackPickerOpen(true); }} />
        </View> : !milestone ? <Button label="Logga träningspass"
          accessibilityLabel={`Logga ett träningspass för ${selectedStep?.title ?? stepId}`} disabled={Boolean(busyStepKey) || !onApplyProgression} onPress={() => setFeedbackPickerOpen(true)} /> : null}
        {!feedbackPickerOpen && currentMilestone ? <View style={styles.milestonePrompt}>
          <Text style={styles.confirmedMilestone}>Delmålet är bekräftat av dig.</Text>
          <Button variant="tertiary" compact label="Ångra bekräftelse" accessibilityLabel={`Ångra bekräftelsen för ${selectedStep?.title ?? stepId}`}
            disabled={Boolean(busyStepKey) || !onApplyProgression}
            onPress={() => { void submitProgressionAction(program.id, { kind: 'undo_step', programVersionId: program.id, stepId, expectedMilestoneId: currentMilestone.id }, 'Bekräftelsen är ångrad.'); }} />
        </View> : null}
        {!feedbackPickerOpen ? <View style={styles.journeyActions}>
          {view.canGoBack ? <Button variant="tertiary" compact label="Backa" accessibilityLabel="Backa till föregående träningssteg" disabled={Boolean(busyStepKey) || !onApplyProgression}
            onPress={() => { void submitProgressionAction(program.id, { kind: 'back', programVersionId: program.id, stepId }, 'Ni är tillbaka på föregående steg.'); }} /> : null}
          {view.canGoNext ? <Button label="Fortsätt till nästa steg" accessibilityLabel="Fortsätt till nästa träningssteg" loading={busy}
            disabled={Boolean(busyStepKey) || !onApplyProgression}
            onPress={() => { void submitProgressionAction(program.id, { kind: 'next', programVersionId: program.id, stepId }, 'Nästa steg är sparat.'); }} /> : null}
          {milestone && !view.canGoNext ? <Button variant="tertiary" compact label="Logga ett pass till" accessibilityLabel="Logga ett träningspass till för det här steget" disabled={Boolean(busyStepKey) || !onApplyProgression}
            onPress={() => { setFeedbackDraft(null); setFeedbackPickerOpen(true); }} /> : null}
        </View> : null}
      </> : <View style={styles.emptyCard}>
        <Text style={styles.body}>Träningsresan är pausad. Återuppta den i programöversikten innan nästa pass.</Text>
      </View>}
    </View>;
  }

  function stepRows(program: PublishedTrainingProgram) {
    const states = stepStates(program);
    const journeyView = progressionState === 'ready' ? trainingProgressionPresentation(progression, program.id, program.steps) : null;
    const journeyData = journeyView?.journey ? progressionForProgram(progression, program.id) : null;
    const activeStepId = journeyView?.activeStepId ?? program.steps[states.indexOf('current')]?.id ?? null;
    const confirmedAtByStepId = Object.fromEntries((journeyData?.milestones ?? []).map((milestone) => [milestone.step_id, milestone.confirmed_at]));
    const entries = buildTrainingTimeline(
      program.steps,
      activeStepId,
      confirmedAtByStepId,
      program.completedAtByStepId,
      new Set(program.completedStepIds),
      undefined,
      undefined,
      journeyView?.journey ? 'Aktivt steg' : 'Nästa övning',
    );
    const activeIndex = entries.findIndex((entry) => entry.state === 'active');
    return <View style={styles.timeline} testID="training-journey-timeline">{entries.map((entry) => {
      const step = entry.step;
      const active = entry.state === 'active';
      const future = entry.state === 'upcoming';
      const confirmed = entry.state === 'confirmed';
      const tint = confirmed ? tokens.colors.success : active ? tokens.colors.training.accent : tokens.colors.borderStrong;
      const legacyActivityMarked = Boolean(entry.legacyActivityLabel);
      const stateIcon = confirmed ? 'checkmark-circle' : active ? 'radio-button-on' : entry.state === 'previous' && legacyActivityMarked ? 'checkmark-circle-outline' : 'ellipse-outline';
      const legacyLabel = entry.legacyActivityLabel;
      const timelineAccessibilityLabel = active
        ? journeyView?.journey ? `Aktivt steg i träningsresan: ${step.title}` : `Nästa övning: ${step.title}, övning ${entry.index + 1} av ${entries.length}`
        : future ? `Kommande övning: ${step.title}, kommer efter övning ${Math.max(1, activeIndex + 1)}${legacyLabel ? `, ${legacyLabel}` : ''}`
          : confirmed ? `Delmål bekräftat: ${step.title}` : `Tidigare steg: ${step.title}${legacyLabel ? `, ${legacyLabel}` : ''}`;
      const completeAnimationKey = animateCompleteTarget?.programId === program.id && animateCompleteTarget.stepId === step.id ? animateCompleteTarget.key : undefined;
      if (active) return <View key={step.id} testID={`training-timeline-step-${step.id}`} style={[styles.timelineRow, styles.timelineActiveRow]}>
        <View style={styles.timelineRail}>
          {entry.index < entries.length - 1 ? <View style={[styles.timelineConnector, { backgroundColor: entry.state === 'confirmed' ? tokens.colors.success : tokens.colors.border }]} /> : null}
          <TrainingTimelineStatusIcon name={stateIcon} size={tokens.size.iconSm} color={tint}
            animateCompleteKey={animateCompleteTarget?.programId === program.id && animateCompleteTarget.stepId === step.id ? animateCompleteTarget.key : undefined}
            onCompleteAnimationStart={consumeCompletionAnimation} />
        </View>
        <View style={styles.timelineCopy}>
          <Text style={styles.timelineStatus}>{entry.statusLabel} · {entry.index + 1}/{entries.length}</Text>
          <Text style={styles.timelineTitle}>{step.title}</Text>
          {entry.milestoneLabel ? <Text style={styles.timelineStatus}>{entry.milestoneLabel}</Text> : null}
          <Text style={styles.timelineInstruction} numberOfLines={2}>{trainingInstructionPreview(step.instruction)}</Text>
          <Button variant="secondary" compact label={journeyView?.journey && !journeyView.canLogSession ? 'Visa övning' : 'Öva nu'}
            accessibilityLabel={`Öppna ${journeyView?.journey && !journeyView.canLogSession ? 'pausad' : journeyView?.journey ? 'aktivt' : 'nästa'} steg: ${step.title}`}
            onPress={() => setSelection({ programId: program.id, stepId: step.id })} />
        </View>
        <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tint} />
      </View>;
      return <Pressable key={step.id} testID={`training-timeline-step-${step.id}`} accessibilityRole="button"
        accessibilityLabel={timelineAccessibilityLabel} accessibilityHint="Öppnar övningsinstruktionen. Kommande steg är endast förhandsvisningar."
        onPress={() => setSelection({ programId: program.id, stepId: step.id })}
        style={({ pressed }) => [styles.timelineRow, future && styles.timelineUpcomingRow, pressed && styles.pressed]}>
        <View style={styles.timelineRail}>
          {entry.index < entries.length - 1 ? <View style={[styles.timelineConnector, { backgroundColor: entry.state === 'confirmed' ? tokens.colors.success : tokens.colors.border }]} /> : null}
          <TrainingTimelineStatusIcon name={stateIcon} size={tokens.size.iconSm} color={tint}
            animateCompleteKey={completeAnimationKey} onCompleteAnimationStart={consumeCompletionAnimation} />
        </View>
        <View style={styles.timelineCopy}>
          <Text style={[styles.timelineStatus, future && styles.timelineUpcomingText]}>{entry.statusLabel} · {entry.index + 1}/{entries.length}</Text>
          <Text style={[styles.timelineTitle, future && styles.timelineUpcomingText]}>{step.title}</Text>
          {legacyLabel ? <Text style={[styles.timelineStatus, future && styles.timelineUpcomingText]}>{legacyLabel}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tint} />
      </Pressable>;
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
      <TrainingInstruction instruction={historicalDetail.detail.instruction} />
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
      <TrainingInstruction instruction={selectedStep.instruction} />
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
        <Pressable accessibilityRole="button" accessibilityLabel={`Läs om ${openProgram.title} och dess källor`} onPress={() => { setSourceMessage(''); setSelection({ programId: openProgram.id, stepId: '' }); }} style={({ pressed }) => [styles.programInfoAction, pressed && styles.pressed]}>
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
          const progressLabel = journeyProgress
            ? `${journeyStepProgressLabel(journeyProgress.confirmedMilestones, program.steps.length)} · ${journeySessionCountLabel(journeyProgress.loggedSessions)}`
            : exerciseProgressLabel(program);
          return <Card key={program.id} onPress={() => setOpenProgramId(program.id)} accessibilityLabel={`${program.title}, ${word}, ${progressLabel}. Öppna programmet`}>
            <View style={styles.programInner}>
              <View style={styles.programHeader}>
                <Text style={styles.programTitle}>{program.title}</Text>
                <Text style={styles.programStatus}>{word}</Text>
              </View>
              <Text style={styles.stepMeta}>{exerciseCountLabel(program.steps.length)}</Text>
              {journeyProgress ? <>
                <Progress value={program.steps.length > 0 ? journeyProgress.confirmedMilestones / program.steps.length * 100 : 0}
                  label={journeyStepProgressLabel(journeyProgress.confirmedMilestones, program.steps.length)} />
                <Text style={styles.stepMeta}>{journeySessionCountLabel(journeyProgress.loggedSessions)}</Text>
              </> : <Progress value={percentage(program)} label={progressLabel} />}
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
          const progressLabel = journeyProgress
            ? `${journeyStepProgressLabel(journeyProgress.confirmedMilestones, program.steps.length)} · ${journeySessionCountLabel(journeyProgress.loggedSessions)}`
            : exerciseProgressLabel(program);
          return <Card key={program.id} onPress={() => { setResetTarget(null); setOpenProgramId(program.id); }} accessibilityLabel={`${program.title}, ${word}, ${progressLabel}. Öppna programmet`}>
            <View style={styles.programInner}>
              <View style={styles.programHeader}>
                <Text style={styles.programTitle}>{program.title}</Text>
                <Text style={styles.programStatus}>{word}</Text>
              </View>
              <Text style={styles.stepMeta}>{exerciseCountLabel(program.steps.length)}</Text>
              {journeyProgress ? <>
                <Progress value={program.steps.length > 0 ? journeyProgress.confirmedMilestones / program.steps.length * 100 : 0}
                  label={journeyStepProgressLabel(journeyProgress.confirmedMilestones, program.steps.length)} />
                <Text style={styles.stepMeta}>{journeySessionCountLabel(journeyProgress.loggedSessions)}</Text>
              </> : <Progress value={percentage(program)} label={progressLabel} />}
            </View>
          </Card>;
        })}</View> : null}
      </View> : null}
    </>}

    <BottomSheet visible={Boolean(selectedProgram)} title={waitingForSelectedRefresh ? 'Träning' : selectedStep ? 'Övning' : 'Om programmet'} onRequestClose={() => { if (!busyStepKey && !waitingForSelectedRefresh) setSelection(null); }}>
      {waitingForSelectedRefresh ? <View style={styles.emptyCard}><Text style={styles.body}>Ändringen är sparad. Hämtar det aktiva steget.</Text></View> : <>
      <Text style={styles.sheetHeading}>{selectedStep?.title ?? selectedProgram?.title}</Text>
      {selectedProgram?.is_ai_generated ? <Text style={styles.note}>AI-genererat innehåll</Text> : null}
      {selectedStep ? <TrainingInstruction instruction={selectedStep.instruction} /> : <Text style={styles.body}>{selectedProgram?.body}</Text>}
      <Text style={styles.note}>Anpassa efter din hund och pausa när det behövs.</Text>
      {!selectedStep && selectedProgram ? <>
        <View style={styles.referenceLinks}>{selectedProgram.sources.map((source, index) => {
          const url = getSafeContentSourceUrl(source);
          if (!url) return <Text key={`${index}:${source}`} style={styles.note}>{source}</Text>;
          return <Pressable key={`${index}:${source}`} accessibilityRole="link" accessibilityLabel={`Öppna referens ${index + 1}: ${new URL(url).hostname}`}
            style={styles.referenceLink} onPress={() => { void Linking.openURL(url).then(() => setSourceMessage('')).catch(() => setSourceMessage('Källan kunde inte öppnas. Försök igen.')); }}>
            <Text style={styles.referenceNumber}>{index + 1})</Text>
          </Pressable>;
        })}</View>
        {sourceMessage ? <Text accessibilityLiveRegion="polite" style={styles.note}>{sourceMessage}</Text> : null}
      </> : null}
      {selectedProgram && selectedStep && !selectedTimelineReadOnly && (progressionState !== 'ready' || !progression.journeys.some((journey) => journey.program_version_id === selectedProgram.id) || progression.journeys.find((journey) => journey.program_version_id === selectedProgram.id)?.state === 'paused') ? renderJourneyOverview(selectedProgram) : null}
      {selectedProgram && selectedStep ? renderJourneyExercise(selectedProgram, selectedStep.id) : null}
      {selectedStep && selectedTimelineReadOnly ? <View style={styles.readOnlyNotice} testID="training-step-read-only">
        <Ionicons name="eye-outline" size={tokens.size.iconSm} color={tokens.colors.textSecondary} />
        <Text style={styles.noteCompact}>{selectedTimelineEntry?.state === 'upcoming' ? 'Kommande steg · endast förhandsvisning' : 'Tidigare steg · endast läsning'}</Text>
      </View> : selectedStep && !feedbackPickerOpen && !selectedJourneyView?.journey ? <View style={styles.legacySection}>
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

function TrainingInstruction({ instruction }: { instruction: string }) {
  return <View style={styles.instructionBlocks}>{parseTrainingInstruction(instruction).map((block, index) => {
    if (block.type === 'heading') return <Text key={`heading-${index}`} accessibilityRole="header" style={styles.instructionHeading}>{block.text}</Text>;
    if (block.type === 'ordered') return <View key={`list-${index}`} style={styles.instructionList}>{block.items.map((item, itemIndex) =>
      <Text key={`${item.number}-${itemIndex}`} style={styles.body}>{item.number}. {item.text}</Text>)}</View>;
    return <Text key={`paragraph-${index}`} style={styles.body}>{block.text}</Text>;
  })}</View>;
}

function TrainingTimelineStatusIcon({ name, size, color, animateCompleteKey, onCompleteAnimationStart }: {
  name: ComponentProps<typeof Ionicons>['name'];
  size: number;
  color: string;
  animateCompleteKey?: string;
  onCompleteAnimationStart?: (key: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const playedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!animateCompleteKey || playedKey.current === animateCompleteKey) return;
    playedKey.current = animateCompleteKey;
    onCompleteAnimationStart?.(animateCompleteKey);
    scale.stopAnimation();
    if (reducedMotion) { scale.setValue(1); return; }
    scale.setValue(0.72);
    Animated.spring(scale, { toValue: 1, speed: 24, bounciness: 4, useNativeDriver: true }).start();
  }, [animateCompleteKey, onCompleteAnimationStart, reducedMotion, scale]);
  return <Animated.View style={{ transform: [{ scale }] }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Ionicons name={name} size={size} color={color} />
  </Animated.View>;
}

function progressionFingerprint(workspace: TrainingProgressionWorkspace, programId: string) {
  const selected = progressionForProgram(workspace, programId);
  return JSON.stringify({ journey: selected.journey, sessions: selected.sessions.map((row) => row.id), milestones: selected.milestones.map((row) => row.step_id).sort() });
}

function percentage(program: PublishedTrainingProgram) { return program.steps.length ? completedCount(program) / program.steps.length * 100 : 0; }
function trainingJourneyStateLabel(state: 'active' | 'paused' | 'maintenance') {
  return state === 'paused' ? 'Pausad' : 'Pågår';
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
  referenceLinks: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  referenceLink: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  referenceNumber: { ...tokens.typography.smallCaption, color: tokens.colors.primary, textDecorationLine: 'underline' },
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
  timeline: { gap: 0, marginTop: tokens.spacing.sm },
  timelineRow: { minHeight: tokens.size.touchMin + tokens.spacing.md, flexDirection: 'row', alignItems: 'stretch', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.sm, paddingHorizontal: tokens.spacing.xs, borderRadius: tokens.radius.md },
  timelineActiveRow: { backgroundColor: tokens.colors.training.continueSurface, borderWidth: tokens.size.stroke * 2, borderColor: tokens.colors.primary, paddingHorizontal: tokens.spacing.sm },
  timelineUpcomingRow: { backgroundColor: 'transparent' },
  timelineRail: { width: tokens.size.touchMin / 2, alignItems: 'center', position: 'relative', paddingTop: tokens.spacing.xs },
  timelineConnector: { position: 'absolute', width: tokens.size.stroke * 2, top: tokens.spacing.xl, bottom: -tokens.spacing.md, left: tokens.size.touchMin / 4 - tokens.size.stroke, zIndex: -1 },
  timelineCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  timelineStatus: { ...tokens.typography.smallCaption, color: tokens.colors.training.accent, fontWeight: '700' },
  timelineUpcomingText: { color: tokens.colors.textSecondary },
  timelineTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, flexShrink: 1 },
  timelineInstruction: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  instructionBlocks: { gap: tokens.spacing.sm, alignItems: 'stretch' },
  instructionHeading: { ...tokens.typography.label, color: tokens.colors.training.accent, textAlign: 'left' },
  instructionList: { gap: tokens.spacing.xs },
  journeyBanner: { height: 112, width: '100%', borderRadius: tokens.radius.md, overflow: 'hidden', backgroundColor: tokens.colors.training.card, position: 'relative' },
  journeyBannerImage: { position: 'absolute', width: '100%', height: '100%', left: 0, top: 0 },
  journeySummaryLine: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  journeySummaryText: { ...tokens.typography.caption, color: tokens.colors.textPrimary, fontWeight: '700', flexShrink: 1 },
  readOnlyNotice: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs },
  noteCompact: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginVertical: 0 },
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
  feedbackChoices: { gap: tokens.spacing.xs, padding: tokens.spacing.md, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.training.card, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  feedbackHeading: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.xs },
  feedbackOption: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.sm, borderRadius: tokens.radius.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  feedbackOptionSelected: { borderColor: tokens.colors.training.accent, backgroundColor: tokens.colors.training.continueSurface },
  feedbackOptionText: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1 },
  milestonePrompt: { gap: tokens.spacing.xs, paddingVertical: tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.training.continueSurface },
  milestonePromptHeading: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  milestoneTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  confirmedMilestone: { ...tokens.typography.caption, color: tokens.colors.training.accent, fontWeight: '700' },
  progressionMessage: { ...tokens.typography.caption, color: tokens.colors.danger },
});
