import { CHECKLIST_VERSION, type ChecklistTemplate } from './checklist-model';

const row = (key: string, title: string) => ({ key, title });
export const CHECKLIST_TEMPLATES: readonly ChecklistTemplate[] = [
  { id: `${CHECKLIST_VERSION}:before-homecoming`, phase: 'before_homecoming', title: 'Inför hemkomsten', intro: 'Förbered en lugn start hemma.', minAgeWeeks: 0, maxAgeWeeks: 7, items: [row('safe-space', 'Ordna en trygg viloplats'), row('supplies', 'Förbered det viktigaste hemma'), row('vet-contact', 'Ta reda på närmaste veterinär')] },
  { id: `${CHECKLIST_VERSION}:first-days`, phase: 'first_days', title: 'Första dagarna hemma', intro: 'Låt valpen landa i sin egen takt.', minAgeWeeks: 0, maxAgeWeeks: null, items: [row('quiet-start', 'Håll de första dagarna lugna'), row('routine', 'Börja med enkla vardagsrutiner'), row('rest', 'Låt valpen vila ostört')] },
  { id: `${CHECKLIST_VERSION}:8-12-weeks`, phase: '8_12_weeks', title: '8–12 veckor', intro: 'Små, trygga erfarenheter i valpens takt.', minAgeWeeks: 8, maxAgeWeeks: 12, items: [row('name', 'Öva på namnet med belöning'), row('handling', 'Vänj valpen varsamt vid hantering'), row('alone', 'Börja mycket kort med egentid')] },
  { id: `${CHECKLIST_VERSION}:3-6-months`, phase: '3_6_months', title: '3–6 månader', intro: 'Fortsätt bygga vanor steg för steg.', minAgeWeeks: 13, maxAgeWeeks: 25, items: [row('recall', 'Öva inkallning på trygg plats'), row('settle', 'Belöna lugn och vila'), row('walks', 'Utforska omgivningen tillsammans')] },
  { id: `${CHECKLIST_VERSION}:6-12-months`, phase: '6_12_months', title: '6–12 månader', intro: 'Anpassa övningarna efter individen.', minAgeWeeks: 26, maxAgeWeeks: 51, items: [row('review', 'Repetera sådant som fungerar'), row('focus', 'Öva kontakt i lugn miljö'), row('breaks', 'Planera in pauser under aktivitet')] },
  { id: `${CHECKLIST_VERSION}:over-1-year`, phase: 'over_1_year', title: 'Över ett år', intro: 'Fortsätt träna i vardagen och efter behov.', minAgeWeeks: 52, maxAgeWeeks: null, items: [row('enjoy', 'Välj en vardagsfärdighet att öva'), row('adapt', 'Anpassa svårigheten efter hunden'), row('play', 'Avsluta med något hunden uppskattar')] },
];
