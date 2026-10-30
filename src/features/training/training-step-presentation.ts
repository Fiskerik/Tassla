import { parseTrainingInstruction, type TrainingInstructionBlock } from './training-instruction.ts';

// Goals describe the exercise purpose; they never certify ability or drive progress.
const PLAIN_EXERCISES = [
  {
    "title": "Låt hunden välja kontakt",
    "goal": "Ge utrymme för frivillig kontakt utan att locka närmare.",
    "steps": [
      "Sitt stilla och erbjud en avslappnad hand en bit ifrån hunden.",
      "Belöna om hunden själv närmar sig eller nosar.",
      "Försök inte locka den närmare om den väljer att gå undan."
    ]
  },
  {
    "title": "Prova en kort beröring",
    "clarification": "Med steg 1 avses övningen Låt hunden välja kontakt.",
    "goal": "Prova en lätt, kort beröring när kontakten är frivillig och bekväm.",
    "steps": [
      "När hunden självmant söker kontakt och verkar bekväm, prova en lätt, kort beröring på en plats den accepterar.",
      "Belöna och pausa direkt.",
      "Om den blir stel, vänder bort sig eller går undan (tolka signalerna tillsammans och i sitt sammanhang), sluta och återgå senare till steg 1."
    ]
  },
  {
    "title": "Låt hunden välja om ni fortsätter",
    "goal": "Låta fortsatt kontakt vara frivillig, med pauser mellan försöken.",
    "steps": [
      "Erbjud samma enkla beröring igen en annan gång och pausa mellan försöken.",
      "Fortsätt bara när hunden själv stannar kvar och verkar bekväm.",
      "Avsluta om den visar obehag; gör inte övningen till fasthållning."
    ]
  },
  {
    "title": "Börja med att titta",
    "goal": "Observera en vardagssak på ett bekvämt avstånd.",
    "steps": [
      "Välj en lugn och bekant plats.",
      "Låt hunden observera en vardagssak på avstånd där den verkar bekväm.",
      "Belöna frivillig uppmärksamhet och låt den vila eller gå undan."
    ]
  },
  {
    "title": "Låt hunden närma sig själv",
    "goal": "Ge utrymme för frivillig nyfikenhet utan att föra fram.",
    "steps": [
      "När hunden är lugn kan den själv få nosa eller närma sig samma sak.",
      "Belöna lugn nyfikenhet.",
      "Om den tvekar, stanna på lättare avstånd i stället för att föra den fram."
    ]
  },
  {
    "title": "Pausa när hunden behöver det",
    "goal": "Uppmärksamma obehag och anpassa avstånd och svårighet.",
    "steps": [
      "Om hunden sänker kroppen, vänder bort sig, slickar sig om munnen eller försöker gå undan, avsluta och öka avståndet.",
      "Tolka signalerna tillsammans och i sitt sammanhang; en enstaka signal är inte en diagnos.",
      "Prova en enklare situation senare.",
      "Vid återkommande, kraftig eller svår rädsla, kontakta veterinär först; efter medicinsk bedömning kan veterinären vid behov hänvisa till kvalificerad, belöningsbaserad beteendehjälp."
    ]
  },
  {
    "title": "Gör viloplatsen trygg när du är hemma",
    "goal": "Utforska viloplatsen frivilligt med närhet till en person.",
    "steps": [
      "Låt hunden utforska sin valda viloplats medan du finns i närheten.",
      "Du kan sitta lugnt där utan att kräva kontakt.",
      "Låt hunden själv stanna eller gå därifrån."
    ]
  },
  {
    "title": "Prova lite avstånd",
    "goal": "Öva ett litet avstånd i hemmet medan situationen är lugn.",
    "steps": [
      "När hunden är avslappnad på platsen, flytta dig en liten bit medan du fortfarande är hemma och återvänd medan den är lugn.",
      "Öka utmaningen bara efter att hunden bekvämt klarat det föregående steget."
    ]
  },
  {
    "title": "Gå ur sikte och backa vid oro",
    "goal": "Öva en kort stund ur sikte på en bekväm nivå.",
    "steps": [
      "När hunden klarar avståndet lugnt kan du kort gå ur sikte och komma tillbaka innan den blir orolig.",
      "Om den visar oro, avbryt och gå tillbaka till senast bekväma nivå.",
      "Vid kvarstående eller kraftig oro, kontakta veterinär först; efter medicinsk bedömning kan veterinären vid behov hänvisa till kvalificerad, belöningsbaserad beteendehjälp."
    ]
  }
];

const STRUCTURED_EXERCISES = [
  {
    "title": "Kom nära inomhus",
    "goal": "Öva inkallningssignalen på kort avstånd inomhus.",
    "instruction": "### Du behöver\nEn lugn plats och en belöning som hunden uppskattar.\n\n### Så gör ni\n1. Stå nära hunden och vänta tills uppmärksamheten finns hos dig.\n2. Säg en kort inkallningssignal med vänlig röst, ta ett steg bakåt och ge hunden tid att svara innan signalen upprepas.\n3. Beröm och belöna när hunden kommer fram.\n\n### Gör det lättare\nMinska avståndet och ta bort störningar.\n\n### Gör det svårare\nProva från en annan plats i samma rum när övningen känns trygg.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare."
  },
  {
    "title": "Lite mer avstånd",
    "goal": "Öva samma inkallningssignal med lite större avstånd inomhus.",
    "instruction": "### Du behöver\nSamma belöning och en säker plats inomhus.\n\n### Så gör ni\n1. Öka avståndet lite när det korta avståndet fungerar.\n2. Ge samma inkallningssignal och belöna när hunden kommer.\n3. Variera var ni står utan att göra avståndet längre varje gång.\n\n### Gör det lättare\nGå närmare igen.\n\n### Gör det svårare\nProva från ett intilliggande rum när vägen mellan er är fri.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare."
  },
  {
    "title": "En lätt störning",
    "goal": "Öva inkallning med en mild störning på bekvämt avstånd.",
    "instruction": "### Du behöver\nBelöning och en lugn, kontrollerad miljö.\n\n### Så gör ni\n1. Lägg till en mild, kontrollerad vardagsstörning på avstånd. Låt inte hunden behöva närma sig något som skrämmer eller överväldigar.\n2. Börja nära hunden och ge inkallningssignalen när hunden har möjlighet att uppmärksamma dig.\n3. Belöna när hunden kommer och ta sedan en paus.\n\n### Gör det lättare\nÖka avståndet till störningen eller ta bort den.\n\n### Gör det svårare\nVariera störningen försiktigt när hunden kan fokusera.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare."
  },
  {
    "title": "Utomhus i lugn miljö",
    "goal": "Öva inkallning nära i en lugn och säker utomhusmiljö.",
    "instruction": "### Du behöver\nBelöning och en säker inhägnad plats eller långlina fäst i en välpassande sele.\n\n### Så gör ni\n1. Välj en lugn utomhusplats och kontrollera att inhägnaden är säker, eller använd långlina i sele. Håll linan under uppsikt utan att rycka eller dra.\n2. Börja nära och använd samma inkallningssignal som inomhus.\n3. Beröm och belöna när hunden kommer.\n\n### Gör det lättare\nGå närmare eller välj en lugnare plats.\n\n### Gör det svårare\nÖka avståndet lite när hunden är redo.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare. Håll långlinan under uppsikt och dra inte i den."
  },
  {
    "title": "Mer som händer runtomkring",
    "goal": "Öva inkallning med en mild störning på tillräckligt avstånd.",
    "instruction": "### Du behöver\nBelöning och långlina i sele eller en säker inhägnad plats.\n\n### Så gör ni\n1. När den lättare miljön fungerar, välj en plats där en mild, kontrollerad störning finns på tillräckligt avstånd.\n2. Börja med kort avstånd mellan dig och hunden och använd signalen.\n3. Belöna när hunden kommer och anpassa nästa försök efter hur det gick.\n\n### Gör det lättare\nÖka avståndet till störningen och gå närmare hunden.\n\n### Gör det svårare\nVariera antingen avstånd eller störning gradvis, inte båda samtidigt.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare. Håll långlinan under uppsikt och dra inte i den."
  },
  {
    "title": "Öva i vardagen",
    "goal": "Öva inkallning i lugna, säkra vardagsmiljöer.",
    "instruction": "### Du behöver\nBelöning och en säker inhägnad plats eller långlina fäst i sele.\n\n### Så gör ni\n1. Välj en lugn vardagsmiljö på en säker inhägnad plats eller med långlina fäst i sele.\n2. Börja enkelt och belöna när hunden kommer på signalen.\n3. Låt gärna hunden fortsätta med en trygg aktivitet efter belöningen, när situationen tillåter.\n\n### Gör det lättare\nÅtergå till en välbekant plats eller kortare avstånd.\n\n### Gör det svårare\nProva en ny lugn miljö med samma säkerhet och börja nära igen.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare. Håll långlinan under uppsikt och dra inte i den."
  }
];

function normalizeWhitespace(value: string): string { return value.replace(/\s+/gu, ' ').trim(); }

export function presentTrainingInstruction(title: string, instruction: string): { goal: string | null; blocks: TrainingInstructionBlock[]; clarification?: string } {
  const exact = normalizeWhitespace(instruction);
  const plain = PLAIN_EXERCISES.find((entry) => entry.title === title && normalizeWhitespace(entry.steps.join(' ')) === exact);
  if (plain) return {
    goal: plain.goal,
    clarification: plain.clarification,
    blocks: [{ type: 'heading', text: 'Steg för steg' }, { type: 'ordered', items: plain.steps.map((text, index) => ({ number: String(index + 1), text })) }],
  };
  const structured = STRUCTURED_EXERCISES.find((entry) => entry.title === title && normalizeWhitespace(entry.instruction) === exact);
  const blocks = parseTrainingInstruction(instruction);
  const goalIndex = blocks.findIndex((block) => block.type === 'heading' && block.text === 'Mål');
  const explicitGoal = goalIndex >= 0 ? blocks[goalIndex + 1] : undefined;
  const goal = explicitGoal?.type === 'paragraph' ? explicitGoal.text : structured?.goal ?? null;
  return {
    goal,
    blocks: blocks.filter((_, index) => explicitGoal?.type !== 'paragraph' || (index !== goalIndex && index !== goalIndex + 1))
      .map((block) => block.type === 'heading' && block.text === 'Så gör ni' ? { ...block, text: 'Steg för steg' } : block),
  };
}
