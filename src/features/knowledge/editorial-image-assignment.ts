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
]);

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
