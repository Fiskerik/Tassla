import type { KnowledgeImageFocus } from '../knowledge/knowledge-image-layout';

type TrainingImageKey = 'handling' | 'environment' | 'alone' | 'generic';
export type TrainingProgramImage = { key: TrainingImageKey; focus: KnowledgeImageFocus };

const images: Record<TrainingImageKey, TrainingProgramImage> = {
  handling: { key: 'handling', focus: { x: 0.65, y: 0.48, zoom: 1, aspectRatio: 3 / 2 } },
  environment: { key: 'environment', focus: { x: 0.51, y: 0.46, zoom: 1, aspectRatio: 2 / 3 } },
  alone: { key: 'alone', focus: { x: 0.65, y: 0.53, zoom: 1, aspectRatio: 3 / 2 } },
  generic: { key: 'generic', focus: { x: 0.5, y: 0.35, zoom: 1, aspectRatio: 4 / 3 } },
};

const programImages: Readonly<Record<string, TrainingImageKey>> = {
  '61000000-0000-4000-8000-000000000009:1': 'handling',
  '61000000-0000-4000-8000-000000000010:1': 'environment',
  '61000000-0000-4000-8000-000000000011:1': 'alone',
  '15711f2f-19e5-51f2-909a-69b300b4ad0f:1': 'generic',
};

export function trainingProgramImage(program: { content_id: string; version: number }): TrainingProgramImage {
  return images[programImages[`${program.content_id}:${program.version}`] ?? 'generic'];
}
