import type { ImageSourcePropType } from 'react-native';
import type { HomeContent } from '../../data/app-data';

const EDITORIAL_IMAGES = [
  require('../../../assets/images/knowledge-featured-puppy-lagotto-forest.jpg'),
  require('../../../assets/images/knowledge-card-puppy-sheltie-window.jpg'),
  require('../../../assets/images/knowledge-card-puppy-cocker-coast.jpg'),
] as const satisfies readonly ImageSourcePropType[];

const REVIEW_IMAGE_BY_GUIDE_VERSION = new Map<string, number>([
  ['review-v1:training:trygg-start:1', 0],
  ['review-v1:training:kontakt:1', 1],
  ['review-v1:training:vardagsro:1', 2],
  ['fixture-guide:calm-start:1', 0],
  ['fixture-guide:rest:1', 1],
  ['fixture-guide:handling:1', 2],
]);

const KNOWLEDGE_IMAGE_BY_GUIDE_VERSION = new Map<string, ImageSourcePropType>([
  ['61000000-0000-4000-8000-000000000002:1', require('../../../assets/images/knowledge-card-puppy-sheltie-window.jpg')],
  ['61000000-0000-4000-8000-000000000003:1', require('../../../assets/images/knowledge-card-puppy-cocker-coast.jpg')],
  ['61000000-0000-4000-8000-000000000004:1', require('../../../assets/images/knowledge-guide-handling.jpg')],
  ['61000000-0000-4000-8000-000000000006:1', require('../../../assets/images/puppy-resting-carousel.png')],
  ['61000000-0000-4000-8000-000000000007:1', require('../../../assets/images/knowledge-guide-weight.jpg')],
  ['61000000-0000-4000-8000-000000000008:1', require('../../../assets/images/knowledge-guide-vet.jpg')],
]);

/** Returns only an explicitly assigned photo; unassigned guides stay text-only. */
export function knowledgeImageForGuide(item: Pick<HomeContent, 'contentId' | 'version'>): ImageSourcePropType | null {
  if (!item.contentId || !Number.isSafeInteger(item.version) || item.version < 1) return null;
  const identity = `${item.contentId}:${item.version}`;
  const reviewIndex = REVIEW_IMAGE_BY_GUIDE_VERSION.get(identity);
  return reviewIndex === undefined ? KNOWLEDGE_IMAGE_BY_GUIDE_VERSION.get(identity) ?? null : EDITORIAL_IMAGES[reviewIndex];
}

/** Ger varje publicerad guide samma dekorativa bild oavsett sökning eller ordning. */
export function editorialImageForGuide(item: Pick<HomeContent, 'contentId' | 'version'>): ImageSourcePropType {
  if (!item.contentId || !Number.isSafeInteger(item.version) || item.version < 1) return EDITORIAL_IMAGES[0];

  const identity = `${item.contentId}:${item.version}`;
  const reviewIndex = REVIEW_IMAGE_BY_GUIDE_VERSION.get(identity);
  if (reviewIndex !== undefined) return EDITORIAL_IMAGES[reviewIndex];

  let hash = 2166136261;
  for (let index = 0; index < identity.length; index += 1) {
    hash ^= identity.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return EDITORIAL_IMAGES[(hash >>> 0) % EDITORIAL_IMAGES.length];
}
