import type { ImageSourcePropType } from 'react-native';
import type { ChecklistTemplate } from './checklist-model';
import type { KnowledgeImageFocus } from './knowledge-image-layout';

export interface ChecklistPhaseVisual {
  source: ImageSourcePropType;
  focus: KnowledgeImageFocus;
}

const PHASE_VISUALS: Readonly<Record<ChecklistTemplate['phase'], ChecklistPhaseVisual>> = {
  before_homecoming: {
    source: require('../../../assets/images/dog-welcome.png'),
    focus: { x: 0.67, y: 0.23, zoom: 1, aspectRatio: 1.5 },
  },
  first_days: {
    source: require('../../../assets/images/knowledge-featured-puppy-lagotto-forest.jpg'),
    focus: { x: 0.66, y: 0.21, zoom: 1, aspectRatio: 1.5 },
  },
  '8_12_weeks': {
    source: require('../../../assets/images/knowledge-card-puppy-sheltie-window.jpg'),
    focus: { x: 0.5, y: 0.18, zoom: 1, aspectRatio: 1.5 },
  },
  '3_6_months': {
    source: require('../../../assets/images/knowledge-guide-handling.jpg'),
    focus: { x: 0.66, y: 0.47, zoom: 1, aspectRatio: 1.5 },
  },
  '6_12_months': {
    source: require('../../../assets/images/puppy-training.png'),
    focus: { x: 0.57, y: 0.55, zoom: 1, aspectRatio: 1.5 },
  },
  over_1_year: {
    source: require('../../../assets/images/knowledge-card-puppy-cocker-coast.jpg'),
    focus: { x: 0.31, y: 0.2, zoom: 1, aspectRatio: 1.5 },
  },
};

/** Existing local editorial image and crop for each published checklist phase. */
export function checklistPhaseVisualFor(phase: ChecklistTemplate['phase']): ChecklistPhaseVisual {
  return PHASE_VISUALS[phase];
}
