export interface DevelopmentMilestone {
  id: string;
  title: string;
  description: string;
  sourceUrl: string;
  icon: 'globe-outline' | 'medical-outline' | 'paw';
  tone: 'veterinary' | 'walk' | 'training';
}

/** Temporary general guidance, never a claim about this individual dog's skills. */
export function generalDevelopmentMilestones(ageWeeks: number | null): DevelopmentMilestone[] {
  if (ageWeeks === null || !Number.isFinite(ageWeeks) || ageWeeks < 0) return [];
  const items: DevelopmentMilestone[] = [];
  if (ageWeeks <= 14) items.push({
    id: 'new-experiences', title: 'Nya intryck',
    description: 'Låt nya möten och miljöer bli lugna och positiva, i hundens egen takt. Pausa vid oro.',
    sourceUrl: 'https://www.dogstrust.org.uk/dog-advice/puppy/puppy-socialisation-introduction',
    icon: 'globe-outline', tone: 'veterinary',
  });
  if (ageWeeks <= 30) items.push({
    id: 'teething', title: 'Tandömsning',
    description: 'Tandömsning börjar ofta runt 3–4 månader och sker gradvis. Tidpunkten varierar.',
    sourceUrl: 'https://vcahospitals.com/know-your-pet/retained-deciduous-teeth-baby-teeth-in-dogs',
    icon: 'medical-outline', tone: 'walk',
  });
  if (ageWeeks <= 104) items.push({
    id: 'adolescence', title: 'Unghundstiden',
    description: 'Unghundstiden innebär en gradvis utveckling. Mognaden varierar mellan individer.',
    sourceUrl: 'https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/puppies-dogs/adolescent-dogs',
    icon: 'paw', tone: 'training',
  });
  return items;
}
