import type { ChecklistContext } from './checklist-model';
import type { HomeContent } from '../../data/app-data';
import type { PublishedTrainingProgram } from '../../data/workspace-data';

export type ReviewFaq = { id: string; context: ChecklistContext; question: string; answer: string };
export const CHECKLIST_DESTINATION_ID = 'review-v1:destination:checklists';
export const FAQ_DESTINATION_ID = 'review-v1:destination:faq';

// Local layout copy only. These examples need human review before publication.
export const REVIEW_FAQ: readonly ReviewFaq[] = [
  { id: 'review-v1:faq:first-night', context: 'first_days', question: 'Hur kan första natten bli lugnare?', answer: 'Ordna en trygg sovplats nära familjen och håll kvällen enkel. Valpar kan behöva gå ut på natten. Följ valpens signaler och sök råd från veterinär vid oro.' },
  { id: 'review-v1:faq:alone-time', context: 'first_days', question: 'När börjar vi träna på att vara ensamma?', answer: 'Börja med mycket korta stunder när valpen är trygg och utvilad. Öka varsamt och backa om valpen blir orolig. Lämna inte valpen ensam längre än den klarar.' },
  { id: 'review-v1:faq:child-contact', context: 'before_homecoming', question: 'Hur möter barn valpen på ett tryggt sätt?', answer: 'Låt en vuxen vara nära och ge valpen möjlighet att gå undan. Visa barnen att de ska vara lugna och låta valpen vila ostört.' },
  { id: 'review-v1:faq:course', context: 'by_age', question: 'När passar en valpkurs?', answer: 'Kursens upplägg och valpens förutsättningar spelar roll. Välj belöningsbaserad träning och fråga arrangören eller veterinär om råd kring ålder, vaccination och smittskydd.' },
];

export function reviewFaqFor(context: ChecklistContext) {
  return REVIEW_FAQ.filter((entry) => entry.context === context);
}

export const REVIEW_TRAINING_PROGRAMS: readonly PublishedTrainingProgram[] = [
  { id: 'review-v1:training:trygg-start', content_id: 'review-v1:training:trygg-start', version: 1, title: 'Trygg start hemma', body: 'Korta övningar för en lugn start. Anpassa tempot efter valpen.', sources: [], is_ai_generated: true, steps: [
    { id: 'review-v1:training:trygg-start:one', position: 1, title: 'Utforska i egen takt', instruction: 'Låt valpen nosa på en lugn plats och belöna frivilligt lugn.' },
    { id: 'review-v1:training:trygg-start:two', position: 2, title: 'Vila nära', instruction: 'Öva en kort stund på att slå sig till ro med familjen i närheten.' },
  ], completedStepIds: [], completedAtByStepId: {} },
  { id: 'review-v1:training:kontakt', content_id: 'review-v1:training:kontakt', version: 1, title: 'Kontakt och namn', body: 'Lekfulla kontaktövningar i en miljö där valpen kan lyckas.', sources: [], is_ai_generated: true, steps: [
    { id: 'review-v1:training:kontakt:one', position: 1, title: 'Säg namnet en gång', instruction: 'När valpen vänder sig mot dig, markera och belöna lugnt.' },
    { id: 'review-v1:training:kontakt:two', position: 2, title: 'Följ en rörelse', instruction: 'Ta ett steg åt sidan och belöna om valpen väljer att följa.' },
  ], completedStepIds: [], completedAtByStepId: {} },
  { id: 'review-v1:training:vardagsro', content_id: 'review-v1:training:vardagsro', version: 1, title: 'Vardagsro och hantering', body: 'Frivilliga, korta steg med pauser. Avsluta medan valpen fortfarande är trygg.', sources: [], is_ai_generated: true, steps: [
    { id: 'review-v1:training:vardagsro:one', position: 1, title: 'Paus på filt', instruction: 'Belöna när valpen själv väljer att stanna till på en bekväm filt.' },
    { id: 'review-v1:training:vardagsro:two', position: 2, title: 'Kort beröring', instruction: 'Låt valpen nosa på handen och avsluta efter en lugn, frivillig kontakt.' },
  ], completedStepIds: [], completedAtByStepId: {} },
];

export const REVIEW_TRAINING_GUIDES: readonly HomeContent[] = REVIEW_TRAINING_PROGRAMS.map((program) => ({
  id: program.content_id, contentId: program.content_id, version: 1, title: program.title,
  body: `${program.body}\n\n${program.steps.map((step) => `## ${step.title}\n${step.instruction}`).join('\n\n')}`,
  contentType: 'training_program', sources: program.sources, isAiGenerated: program.is_ai_generated,
}));
