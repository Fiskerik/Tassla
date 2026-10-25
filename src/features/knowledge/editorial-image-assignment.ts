import type { ImageSourcePropType } from 'react-native';
import type { HomeContent } from '../../data/app-data';
import type { KnowledgeImageFocus } from './knowledge-image-layout';

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

const GUIDE_IMAGE_FOCUS_BY_VERSION = new Map<string, KnowledgeImageFocus>([
  ['61000000-0000-4000-8000-000000000002:1', { x: 0.5, y: 0.4, zoom: 1.2, aspectRatio: 1.5 }],
  ['61000000-0000-4000-8000-000000000003:1', { x: 0.34, y: 0.36, zoom: 1.35, aspectRatio: 1.5 }],
  ['61000000-0000-4000-8000-000000000004:1', { x: 0.66, y: 0.62, zoom: 1.3, aspectRatio: 1.5 }],
  ['61000000-0000-4000-8000-000000000006:1', { x: 0.61, y: 0.55, zoom: 1.2, aspectRatio: 1.5 }],
  ['61000000-0000-4000-8000-000000000007:1', { x: 0.4, y: 0.4, zoom: 1.2, aspectRatio: 1.5 }],
  ['61000000-0000-4000-8000-000000000008:1', { x: 0.5, y: 0.5, zoom: 1.15, aspectRatio: 1.5 }],
]);

const EDITORIAL_IMAGE_FOCUS: readonly KnowledgeImageFocus[] = [
  { x: 0.66, y: 0.32, zoom: 1.35, aspectRatio: 1.5 },
  { x: 0.5, y: 0.4, zoom: 1.2, aspectRatio: 1.5 },
  { x: 0.34, y: 0.36, zoom: 1.35, aspectRatio: 1.5 },
];

/** Returns only an explicitly assigned photo; unassigned guides stay text-only. */
export function knowledgeImageForGuide(item: Pick<HomeContent, 'contentId' | 'version' | 'slug'>): ImageSourcePropType | null {
  if (!item.contentId || !Number.isSafeInteger(item.version) || item.version < 1) return null;
  const articleImage = item.slug === 'forsta-dygnet-hemma' ? EDITORIAL_IMAGES[0]
    : item.slug === 'rumsrenhet' ? EDITORIAL_IMAGES[2]
      : item.slug === 'valpens-somn' ? EDITORIAL_IMAGES[1] : null;
  if (articleImage) return articleImage;
  const identity = `${item.contentId}:${item.version}`;
  const reviewIndex = REVIEW_IMAGE_BY_GUIDE_VERSION.get(identity);
  return reviewIndex === undefined ? KNOWLEDGE_IMAGE_BY_GUIDE_VERSION.get(identity) ?? null : EDITORIAL_IMAGES[reviewIndex];
}

/** Positions the assigned dog's face or activity near the center of Knowledge image frames. */
export function knowledgeImageFocusForGuide(
  item: Pick<HomeContent, 'contentId' | 'version' | 'slug'>,
  source: ImageSourcePropType,
): KnowledgeImageFocus {
  const identity = item.contentId && Number.isSafeInteger(item.version) && item.version >= 1
    ? `${item.contentId}:${item.version}` : '';
  const guideFocus = GUIDE_IMAGE_FOCUS_BY_VERSION.get(identity);
  if (guideFocus) return guideFocus;

  const editorialIndex = item.slug === 'forsta-dygnet-hemma' ? 0
    : item.slug === 'valpens-somn' ? 1
      : item.slug === 'rumsrenhet' ? 2 : EDITORIAL_IMAGES.indexOf(source as typeof EDITORIAL_IMAGES[number]);
  return editorialIndex >= 0 ? EDITORIAL_IMAGE_FOCUS[editorialIndex] : { x: 0.5, y: 0.5, zoom: 1.15, aspectRatio: 1.5 };
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
