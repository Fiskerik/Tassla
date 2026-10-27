import type { PublishedTrainingProgram } from '../../data/workspace-data';

/** Only suggest an available program that matches the active dog's context. */
export function selectNextHomeTraining(programs: readonly PublishedTrainingProgram[]): { programId: string; programTitle: string; stepTitle: string } | null {
  for (const program of programs) {
    if (program.currentAgeBreedMatch !== true) continue;
    const step = program.steps.find((item) => !program.completedStepIds.includes(item.id));
    if (step) return { programId: program.id, programTitle: program.title, stepTitle: step.title };
  }
  return null;
}
