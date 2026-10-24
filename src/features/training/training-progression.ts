export type TrainingJourneyState = 'active' | 'paused' | 'maintenance';
export type TrainingSessionFeedback = 'worked_as_planned' | 'practice_more' | 'paused_early';

export interface TrainingJourney {
  id: string;
  dog_id: string;
  program_version_id: string;
  active_step_id: string;
  state: TrainingJourneyState;
  last_operation_id: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingSession {
  id: string;
  journey_id: string;
  dog_id: string;
  program_version_id: string;
  step_id: string;
  operation_id: string;
  feedback: TrainingSessionFeedback;
  performed_at: string;
}

export interface TrainingMilestone {
  id: string;
  journey_id: string;
  dog_id: string;
  program_version_id: string;
  step_id: string;
  confirmation_operation_id: string;
  confirmed_at: string;
}

export interface TrainingProgressionWorkspace {
  journeys: TrainingJourney[];
  sessions: TrainingSession[];
  milestones: TrainingMilestone[];
}

export type TrainingProgressionAction =
  | { kind: 'start_or_resume'; programVersionId: string }
  | { kind: 'record_session'; programVersionId: string; stepId: string; feedback: TrainingSessionFeedback }
  | { kind: 'confirm_step'; programVersionId: string; stepId: string }
  | { kind: 'next' | 'back' | 'repeat' | 'pause' | 'maintenance'; programVersionId: string; stepId: string };

export interface PendingTrainingProgression {
  action: TrainingProgressionAction;
  operationId: string;
  status: 'pending' | 'unknown';
}

export interface TrainingProgressionResult {
  operation_id: string;
  action: TrainingProgressionAction['kind'];
  journey_id: string;
  dog_id: string;
  program_version_id: string;
  active_step_id: string;
  state: TrainingJourneyState;
  session_id: string | null;
  milestone_id: string | null;
}

export interface HomeTrainingProgressionSummary {
  journey: TrainingJourney;
  programTitle: string | null;
  activeStepTitle: string | null;
  loggedSessions: number;
  confirmedMilestones: number;
}

export interface HomeTrainingJourneyDisplay {
  summary: HomeTrainingProgressionSummary | null;
  readError: boolean;
  pending: PendingTrainingProgression | null;
}

export interface TrainingProgressionPresentation {
  journey: TrainingJourney | null;
  stateLabel: string;
  activeStepId: string | null;
  activeStepTitle: string | null;
  loggedSessions: number;
  confirmedMilestones: number;
  currentStepSessions: number;
  currentStepConfirmed: boolean;
  canStartOrResume: boolean;
  canLogSession: boolean;
  canConfirmStep: boolean;
  canRepeat: boolean;
  canGoBack: boolean;
  canGoNext: boolean;
  canPause: boolean;
  canSetMaintenance: boolean;
}

export function emptyTrainingProgression(): TrainingProgressionWorkspace {
  return { journeys: [], sessions: [], milestones: [] };
}

export function progressionForProgram(
  workspace: TrainingProgressionWorkspace,
  programVersionId: string,
): { journey: TrainingJourney | null; sessions: TrainingSession[]; milestones: TrainingMilestone[] } {
  const journey = workspace.journeys.find((row) => row.program_version_id === programVersionId) ?? null;
  if (!journey) return { journey: null, sessions: [], milestones: [] };
  return {
    journey,
    sessions: workspace.sessions.filter((row) => row.journey_id === journey.id),
    milestones: workspace.milestones.filter((row) => row.journey_id === journey.id),
  };
}

export function trainingProgressionPresentation(
  workspace: TrainingProgressionWorkspace,
  programVersionId: string,
  steps: readonly { id: string; title: string }[],
): TrainingProgressionPresentation {
  const selected = progressionForProgram(workspace, programVersionId);
  const journey = selected.journey;
  if (!journey) {
    return {
      journey: null,
      stateLabel: 'Inte påbörjad',
      activeStepId: null,
      activeStepTitle: null,
      loggedSessions: 0,
      confirmedMilestones: 0,
      currentStepSessions: 0,
      currentStepConfirmed: false,
      canStartOrResume: steps.length > 0,
      canLogSession: false,
      canConfirmStep: false,
      canRepeat: false,
      canGoBack: false,
      canGoNext: false,
      canPause: false,
      canSetMaintenance: false,
    };
  }
  const stepIndex = steps.findIndex((step) => step.id === journey.active_step_id);
  const currentStepSessions = selected.sessions.filter((session) => session.step_id === journey.active_step_id).length;
  const currentStepConfirmed = selected.milestones.some((milestone) => milestone.step_id === journey.active_step_id);
  const canPractice = journey.state !== 'paused' && stepIndex >= 0;
  return {
    journey,
    stateLabel: journey.state === 'paused' ? 'Pausad' : journey.state === 'maintenance' ? 'Underhåll' : 'Pågående',
    activeStepId: stepIndex >= 0 ? journey.active_step_id : null,
    activeStepTitle: stepIndex >= 0 ? steps[stepIndex].title : null,
    loggedSessions: selected.sessions.length,
    confirmedMilestones: new Set(selected.milestones.map((milestone) => milestone.step_id)).size,
    currentStepSessions,
    currentStepConfirmed,
    canStartOrResume: journey.state === 'paused' && stepIndex >= 0,
    canLogSession: canPractice,
    canConfirmStep: canPractice && currentStepSessions > 0 && !currentStepConfirmed,
    canRepeat: canPractice,
    canGoBack: canPractice && stepIndex > 0,
    canGoNext: canPractice && currentStepConfirmed && stepIndex < steps.length - 1,
    canPause: canPractice,
    canSetMaintenance: canPractice && journey.state !== 'maintenance',
  };
}

export function latestHomeTrainingSummary(
  workspace: TrainingProgressionWorkspace,
  programs: readonly { id: string; title: string; steps: readonly { id: string; title: string }[] }[],
): HomeTrainingProgressionSummary | null {
  const journey = [...workspace.journeys].sort((left, right) =>
    right.updated_at.localeCompare(left.updated_at)
      || left.program_version_id.localeCompare(right.program_version_id)
      || left.id.localeCompare(right.id))[0];
  if (!journey) return null;
  const program = programs.find((row) => row.id === journey.program_version_id);
  const step = program?.steps.find((row) => row.id === journey.active_step_id);
  return {
    journey,
    programTitle: program?.title ?? null,
    activeStepTitle: step?.title ?? null,
    loggedSessions: workspace.sessions.filter((row) => row.journey_id === journey.id).length,
    confirmedMilestones: new Set(workspace.milestones.filter((row) => row.journey_id === journey.id).map((row) => row.step_id)).size,
  };
}

export function homeTrainingJourneyDisplay(
  summary: HomeTrainingProgressionSummary | null,
  progressionState: 'ready' | 'error',
  pending: PendingTrainingProgression | null,
): HomeTrainingJourneyDisplay {
  return {
    summary: progressionState === 'ready' ? summary : null,
    readError: progressionState === 'error',
    pending,
  };
}

export function sameTrainingProgressionAction(left: TrainingProgressionAction, right: TrainingProgressionAction): boolean {
  return left.kind === right.kind
    && left.programVersionId === right.programVersionId
    && ('stepId' in left ? left.stepId : null) === ('stepId' in right ? right.stepId : null)
    && ('feedback' in left ? left.feedback : null) === ('feedback' in right ? right.feedback : null);
}

export function isTrainingProgressionResult(value: unknown): value is TrainingProgressionResult {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  const validAction = row.action === 'start_or_resume' || row.action === 'record_session'
    || row.action === 'confirm_step' || row.action === 'next' || row.action === 'back'
    || row.action === 'repeat' || row.action === 'pause' || row.action === 'maintenance';
  return typeof row.operation_id === 'string'
    && validAction
    && typeof row.journey_id === 'string'
    && typeof row.dog_id === 'string'
    && typeof row.program_version_id === 'string'
    && typeof row.active_step_id === 'string'
    && (row.state === 'active' || row.state === 'paused' || row.state === 'maintenance')
    && (row.session_id === null || typeof row.session_id === 'string')
    && (row.milestone_id === null || typeof row.milestone_id === 'string');
}

export function operationAppearsInReadback(
  workspace: TrainingProgressionWorkspace,
  result: TrainingProgressionResult,
): boolean {
  const journey = workspace.journeys.find((row) => row.id === result.journey_id
    && row.dog_id === result.dog_id && row.program_version_id === result.program_version_id);
  if (!journey) return false;
  if (result.action === 'record_session') {
    return Boolean(result.session_id && workspace.sessions.some((row) => row.id === result.session_id
      && row.operation_id === result.operation_id && row.journey_id === journey.id));
  }
  if (result.action === 'confirm_step') {
    return Boolean(result.milestone_id && workspace.milestones.some((row) => row.journey_id === journey.id
      && row.id === result.milestone_id));
  }
  if (result.action === 'start_or_resume') return true;
  return journey.last_operation_id === result.operation_id
      && journey.active_step_id === result.active_step_id
      && journey.state === result.state;
}

export function operationAppliedToWorkspace(
  workspace: TrainingProgressionWorkspace,
  dogId: string,
  action: TrainingProgressionAction,
  operationId: string,
): boolean {
  const journey = workspace.journeys.find((row) => row.dog_id === dogId
    && row.program_version_id === action.programVersionId);
  if (!journey) return false;
  if (action.kind === 'start_or_resume') return journey.last_operation_id === operationId && journey.state === 'active';
  if (action.kind === 'record_session') return workspace.sessions.some((row) => row.dog_id === dogId
    && row.program_version_id === action.programVersionId && row.operation_id === operationId);
  if (action.kind === 'confirm_step') return workspace.milestones.some((row) => row.journey_id === journey.id
    && row.step_id === action.stepId && row.confirmation_operation_id === operationId);
  return journey.last_operation_id === operationId;
}
