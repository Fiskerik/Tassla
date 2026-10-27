import type { AnalyticsEventType } from './analytics-model';
import type { TrainingProgressionAction, TrainingProgressionWorkspace } from '../features/training/training-progression';

/** Decide from the confirmed snapshot before a successful operation; never include dog or content identifiers. */
export function progressionAnalyticsEvent(snapshot: TrainingProgressionWorkspace, confirmed: TrainingProgressionWorkspace, dogId: string, action: TrainingProgressionAction, operationId: string): AnalyticsEventType | null {
  const journey = snapshot.journeys.find(row => row.dog_id === dogId && row.program_version_id === action.programVersionId);
  const savedJourney = confirmed.journeys.find(row => row.dog_id === dogId && row.program_version_id === action.programVersionId);
  if (action.kind === 'start_or_resume') return !journey && savedJourney?.last_operation_id === operationId ? 'training_started' : null;
  if (action.kind !== 'confirm_step' || !journey) return null;
  const alreadyConfirmed = snapshot.milestones.some(row => row.dog_id === dogId && row.journey_id === journey.id && row.step_id === action.stepId);
  const confirmedByOperation = confirmed.milestones.some(row => row.dog_id === dogId && row.journey_id === journey.id
    && row.step_id === action.stepId && row.confirmation_operation_id === operationId);
  return !alreadyConfirmed && confirmedByOperation ? 'training_completed' : null;
}
