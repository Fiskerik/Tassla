import type { PublishedTrainingProgram } from '../../data/workspace-data';

/** Only suggest an available program that matches the active dog's context. */
export function selectNextHomeTraining(programs: readonly PublishedTrainingProgram[], unavailableVersions: ReadonlySet<string> = new Set()): { programId: string; programTitle: string; stepId: string; stepTitle: string } | null {
  for (const program of programs) {
    if (program.currentAgeBreedMatch !== true || unavailableVersions.has(program.id)) continue;
    const step = program.steps.find((item) => !program.completedStepIds.includes(item.id));
    if (step) return { programId: program.id, programTitle: program.title, stepId: step.id, stepTitle: step.title };
  }
  return null;
}
