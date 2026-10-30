import type { PublishedTrainingProgram } from '../../data/workspace-data';
import type { TrainingProgressionWorkspace } from '../training/training-progression';
import type { DailyTrainingSelection } from './daily-activity-data';
import { nextSelectableTrainingStep } from './daily-activity-model';

export type HomeDailyTrainingOption = {
  programId: string;
  versionId: string;
  stepId: string;
  programTitle: string;
  stepTitle: string;
  source?: 'journey' | 'suggestion';
  stepNumber?: number;
  stepCount?: number;
};

export function buildDailyTrainingOptions(
  dogId: string,
  programs: readonly PublishedTrainingProgram[],
  progression: TrainingProgressionWorkspace,
  state: 'ready' | 'error',
  selections: readonly DailyTrainingSelection[],
): HomeDailyTrainingOption[] {
  if (state !== 'ready') return [];
  const selected = new Set(selections.filter((row) => row.dog_id === dogId).map((row) => `${row.program_version_id}:${row.step_id}`));
  const options = programs.flatMap((program) => {
    if (program.id.startsWith('review-v1:training:')) return [];
    const journey = progression.journeys.find((row) => row.dog_id === dogId && row.program_version_id === program.id);
    if (journey && journey.state !== 'active' && journey.state !== 'maintenance') return [];
    const resumed = programs.filter((row) => row.content_id === program.content_id && row.completedStepIds.length > 0);
    if (!journey && (program.completedStepIds.length > 0
      ? resumed.some((row) => row.version > program.version)
      : resumed.length > 0 || program.currentAgeBreedMatch === false)) return [];
    const step = journey ? program.steps.find((row) => row.id === journey.active_step_id) : nextSelectableTrainingStep(program);
    if (!step || selected.has(`${program.id}:${step.id}`)) return [];
    const orderedSteps = [...program.steps].sort((left, right) => left.position - right.position);
    return [{ option: {
      programId: program.content_id, versionId: program.id, stepId: step.id, programTitle: program.title, stepTitle: step.title,
      source: journey ? 'journey' as const : 'suggestion' as const,
      stepNumber: orderedSteps.findIndex((row) => row.id === step.id) + 1, stepCount: orderedSteps.length,
    }, updatedAt: journey?.updated_at ?? '' }];
  }).sort((left, right) => Number(right.option.source === 'journey') - Number(left.option.source === 'journey')
    || right.updatedAt.localeCompare(left.updatedAt) || left.option.programTitle.localeCompare(right.option.programTitle, 'sv'));
  const ongoing = options.filter((row) => row.option.source === 'journey');
  return (ongoing.length ? ongoing : options).map((row) => row.option);
}
