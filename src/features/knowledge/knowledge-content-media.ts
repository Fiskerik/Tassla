import type { ImageSourcePropType } from 'react-native';

const KNOWLEDGE_CONTENT_IMAGES: Readonly<Record<string, ImageSourcePropType>> = {
  '62000000-0000-4000-8000-000000000004': require('../../../assets/images/puppy-training.png'),
  '62000000-0000-4000-8000-000000000006': require('../../../assets/images/puppy-resting-carousel.png'),
};

export function getKnowledgeContentImage(contentVersionId: string): ImageSourcePropType | null {
  return KNOWLEDGE_CONTENT_IMAGES[contentVersionId] ?? null;
}
