export interface TrainingStep {
  id: string;
  title: string;
  body: string;
}

export interface TrainingProgram {
  id: string;
  version: number;
  title: string;
  introduction: string;
  audience?: string;
  steps: readonly TrainingStep[];
  stopText: string;
  sourceTitle: string;
  sourceUrl: string;
  limitation: string;
}

export interface TrainingCompletion {
  dogId: string;
  programId: string;
  programVersion: number;
  stepId: string;
}

export const TRAINING_PROGRAMS: readonly TrainingProgram[] = [
  {
    id: 'gentle-contact',
    version: 1,
    title: 'Varsam kontakt',
    introduction: 'Öva mjuk beröring på hundens villkor, hemma där den känner sig trygg.',
    steps: [
      { id: 'contact-choose', title: 'Låt hunden välja.', body: 'Börja när ni båda är lugna. Låt hunden själv välja att vara nära. Håll inte fast den.' },
      { id: 'contact-reward', title: 'Berör och belöna.', body: 'Om hunden är avslappnad: stryk kort där du vet att den uppskattar beröring. Ta bort handen och ge en belöning den tycker om.' },
      { id: 'contact-pause', title: 'Pausa och välj igen.', body: 'Gör en paus. Fortsätt med samma enkla beröring bara om hunden självmant stannar eller söker kontakt och kroppen är avslappnad. Annars avslutar ni.' },
    ],
    stopText: 'Sluta om hunden går undan eller blir spänd. Stillhet betyder inte automatiskt att den är bekväm. Vid smärta, tydlig rädsla eller aggression vid beröring: kontakta veterinär innan ni fortsätter.',
    sourceTitle: 'Dogs Trust – How to handle your dog',
    sourceUrl: 'https://www.dogstrust.org.uk/dog-advice/health-wellbeing/at-home/how-to-handle-your-dog',
    limitation: 'En försiktig inledning, inte ett komplett hanteringsprogram. Ingen diagnos eller behandling.',
  },
  {
    id: 'new-at-home',
    version: 1,
    title: 'Upptäck något nytt hemma',
    introduction: 'Låt valpen undersöka en liten förändring i en trygg miljö, utan krav på att gå fram.',
    audience: 'Målgrupp: valpar. Detta är inte ett behandlingsprogram för vuxna hundars rädsla.',
    steps: [
      { id: 'new-start', title: 'Börja enkelt.', body: 'Välj en lugn stund hemma. Låt en bekant person visa en vardaglig förändring, till exempel ha på sig en hatt. Börja på avstånd.' },
      { id: 'new-look', title: 'Titta räcker.', body: 'Belöna när valpen lugnt tittar. Den behöver inte gå fram. Låt den själv välja att närma sig eller gå undan.' },
      { id: 'new-finish', title: 'Avsluta lugnt.', body: 'Håll övningen kort. Om valpen blir orolig: avbryt och återgå till det välbekanta. Prova en enklare situation en annan dag.' },
    ],
    stopText: 'Pressa inte valpen närmare. Avsluta om den vill undan eller verkar orolig. Att avbryta är också ett bra val.',
    sourceTitle: 'RSPCA Australia – How can I socialise my puppy?',
    sourceUrl: 'https://kb.rspca.org.au/categories/companion-animals/dogs/puppies/how-can-i-socialise-my-puppy',
    limitation: 'Endast allmänna beteendeprinciper i hemmiljö; inga australiska vård- eller vaccinationsråd för Sverige.',
  },
];

export const TRAINING_NOTICE = 'Allmän träningsvägledning. Anpassa efter din hund. Du kan alltid pausa eller gå tillbaka.';
export const TRAINING_PROGRESS_CAVEAT = 'Registrering betyder att ägaren har markerat ett steg, inte att hunden behärskar beteendet. Ingen automatisk svårighetsökning. Inga fasta tider/exponeringskvoter eller utomhus-/vaccinationsråd.';

export function getCompletedStepIds(
  completions: readonly TrainingCompletion[],
  dogId: string,
  programId: string,
  programVersion: number,
): string[] {
  return completions
    .filter((item) => item.dogId === dogId && item.programId === programId && item.programVersion === programVersion)
    .map((item) => item.stepId);
}

export function completeNextStep(
  completions: readonly TrainingCompletion[],
  dogId: string,
  programId: string,
  programVersion: number,
  stepId: string,
  orderedStepIds: readonly string[],
): TrainingCompletion[] {
  if (!dogId.trim() || !programId.trim() || !Number.isInteger(programVersion) || programVersion < 1) return [...completions];
  if (!orderedStepIds.length || new Set(orderedStepIds).size !== orderedStepIds.length) return [...completions];
  const matching = completions.filter((item) => item.dogId === dogId && item.programId === programId && item.programVersion === programVersion);
  const completed = new Set(matching.map((item) => item.stepId));
  const next = orderedStepIds.find((id) => !completed.has(id));
  if (stepId !== next || !orderedStepIds.includes(stepId)) return [...completions];
  return [...completions, { dogId, programId, programVersion, stepId }];
}

export function resetProgramProgress(
  completions: readonly TrainingCompletion[],
  dogId: string,
  programId: string,
  programVersion: number,
): TrainingCompletion[] {
  return completions.filter((item) => !(item.dogId === dogId && item.programId === programId && item.programVersion === programVersion));
}
