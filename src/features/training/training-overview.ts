// Rena regler för Träningens översikt. Inga React Native- eller dataimporter, så att reglerna kan enhetstestas.
// Typerna är strukturella: PublishedTrainingProgram uppfyller dem utan att den här filen känner till datalagret.

export interface OverviewProgram {
  readonly id: string;
  readonly steps: readonly { readonly id: string }[];
  readonly completedStepIds: readonly string[];
  readonly currentAgeBreedMatch?: boolean;
}

export type ProgramStatus = 'in_progress' | 'not_started' | 'empty' | 'complete';
export type StepState = 'done' | 'current' | 'upcoming';

export function completedCount(program: OverviewProgram): number {
  const completedIds = new Set(program.completedStepIds);
  return new Set(program.steps.filter((step) => completedIds.has(step.id)).map((step) => step.id)).size;
}

export function programStatus(program: OverviewProgram): ProgramStatus {
  if (program.steps.length === 0) return 'empty';
  const done = completedCount(program);
  if (done === 0) return 'not_started';
  return done === program.steps.length ? 'complete' : 'in_progress';
}

export function programStatusWord(status: ProgramStatus): string {
  const labels: Record<ProgramStatus, string> = {
    in_progress: 'Pågår',
    not_started: 'Ej påbörjad',
    empty: 'Inga övningar',
    complete: 'Klar',
  };
  return labels[status];
}

/** Pågående först, ej påbörjade därefter, tomma program sedan och klara sist. */
export function sortPrograms<T extends OverviewProgram>(programs: readonly T[]): T[] {
  const rank: Record<ProgramStatus, number> = { in_progress: 0, not_started: 1, empty: 2, complete: 3 };
  return programs
    .map((program, index) => ({ program, index, rank: rank[programStatus(program)] }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.program);
}

/** Current age/breed-matched programs with a real next exercise, in stable recommendation order. */
export function recommendedPrograms<T extends OverviewProgram>(programs: readonly T[]): T[] {
  return sortPrograms(programs.filter((program) => program.currentAgeBreedMatch === true
    && program.steps.length > 0 && programStatus(program) === 'not_started'));
}

/** Mina means programs with at least one valid, confirmed step in this exact version. */
export function programsWithProgress<T extends OverviewProgram>(programs: readonly T[]): T[] {
  return sortPrograms(programs.filter((program) => completedCount(program) > 0));
}

/** A zero-step program is never complete, and an empty program list has no completion state. */
export function allProgramsComplete(programs: readonly OverviewProgram[]): boolean {
  return programs.length > 0 && programs.every((program) =>
    program.steps.length > 0 && completedCount(program) === program.steps.length,
  );
}

/**
 * Första ej genomförda övningen är den aktuella. Det är samma regel som sheetens "nästa steg":
 * bara den kan markeras. Övningar efter den som redan är markerade förblir klara.
 */
export function stepStates(program: OverviewProgram): StepState[] {
  const completedIds = new Set(program.completedStepIds);
  const currentIndex = program.steps.findIndex((step) => !completedIds.has(step.id));
  return program.steps.map((step, index) => {
    if (completedIds.has(step.id)) return 'done';
    return index === currentIndex ? 'current' : 'upcoming';
  });
}

export interface NextExercise {
  readonly programId: string;
  readonly stepId: string;
  /** 1-baserat nummer, för "övning 3 av 7". */
  readonly number: number;
  readonly total: number;
  readonly kind: 'continue' | 'start';
}

/** Pågående program först (fortsätt där ni var), annars första programmet som inte är påbörjat. */
export function pickNextExercise(programs: readonly OverviewProgram[]): NextExercise | null {
  for (const status of ['in_progress', 'not_started'] as const) {
    const program = programs.find((candidate) => candidate.steps.length > 0 && programStatus(candidate) === status);
    if (!program) continue;
    const index = stepStates(program).indexOf('current');
    if (index < 0) continue;
    return { programId: program.id, stepId: program.steps[index].id, number: index + 1, total: program.steps.length, kind: status === 'in_progress' ? 'continue' : 'start' };
  }
  return null;
}

export function exerciseCountLabel(total: number): string {
  return `${total} ${total === 1 ? 'övning' : 'övningar'}`;
}

export function exerciseProgressLabel(program: OverviewProgram): string {
  if (program.steps.length === 0) return 'Inga övningar';
  const done = completedCount(program);
  return `${done} av ${program.steps.length} ${program.steps.length === 1 ? 'övning klar' : 'övningar klara'}`;
}
