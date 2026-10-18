export interface PublishedContent {
  id: string;
  contentId: string;
  version: number;
  status: 'published';
  minAgeWeeks: number;
  maxAgeWeeks: number | null;
  breedIds: readonly string[];
}

export type ContentSurface = 'home_advice' | 'knowledge_for_you' | 'knowledge_articles' | 'knowledge_faq'
  | 'training_recommended' | 'training_all' | 'log_help' | 'weight_help' | 'health_help';
export type ContentContext = 'dog_advice' | 'training_recommendation' | 'log_routines'
  | 'weight_recording' | 'health_recording';
export type ContentAudience = 'dog_owner' | 'puppy_owner' | 'adult_dog_owner';
export type ContentNeed = 'handling' | 'environment' | 'being_alone' | null;
export interface ContentGrant {
  surface: ContentSurface;
  context: ContentContext;
  audience: ContentAudience;
  need: ContentNeed;
  priority: number;
  ageAgnostic: boolean;
}
export interface ContentPolicy {
  contentVersionId: string;
  grants: readonly ContentGrant[];
}
export interface ContentRequest {
  surface: ContentSurface;
  context: ContentContext;
  audience: ContentAudience;
  dogId: string;
  breedId: string;
  ageWeeks: number | null;
  need: ContentNeed;
}
export type ContentSelection<T> =
  | { status: 'eligible'; items: readonly T[] }
  | { status: 'empty'; items: readonly [] }
  | { status: 'unknown'; reason: 'missing_age' | 'invalid_request' | 'unmapped_version'; items: readonly [] };
export type ContentRead<T> = { status: 'loading' }
  | { status: 'error'; retryable: true }
  | ContentSelection<T>;

const KNOWN_V1_VERSION_IDS = Array.from({ length: 11 }, (_, index) =>
  `62000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
const FUNCTION_CONTENT_GRANTS: Record<string, readonly ContentGrant[]> = {
  '62000000-0000-4000-8000-000000000004': [
    { surface: 'knowledge_faq', context: 'dog_advice', audience: 'dog_owner', need: null, priority: 1, ageAgnostic: false },
    { surface: 'knowledge_for_you', context: 'dog_advice', audience: 'dog_owner', need: null, priority: 1, ageAgnostic: false },
    { surface: 'knowledge_articles', context: 'dog_advice', audience: 'dog_owner', need: null, priority: 1, ageAgnostic: false },
  ],
  '62000000-0000-4000-8000-000000000006': [
    { surface: 'knowledge_faq', context: 'dog_advice', audience: 'dog_owner', need: null, priority: 2, ageAgnostic: false },
    { surface: 'knowledge_for_you', context: 'dog_advice', audience: 'dog_owner', need: null, priority: 2, ageAgnostic: false },
    { surface: 'knowledge_articles', context: 'dog_advice', audience: 'dog_owner', need: null, priority: 2, ageAgnostic: false },
  ],
  '62000000-0000-4000-8000-000000000003': [{ surface: 'log_help', context: 'log_routines', audience: 'dog_owner', need: null, priority: 1, ageAgnostic: true }],
  '62000000-0000-4000-8000-000000000007': [{ surface: 'weight_help', context: 'weight_recording', audience: 'dog_owner', need: null, priority: 1, ageAgnostic: true }],
  '62000000-0000-4000-8000-000000000008': [{ surface: 'health_help', context: 'health_recording', audience: 'dog_owner', need: null, priority: 1, ageAgnostic: true }],
};
const CONTENT_POLICIES: ReadonlyMap<string, ContentPolicy> = new Map(KNOWN_V1_VERSION_IDS.map((contentVersionId) => [
  contentVersionId,
  { contentVersionId, grants: FUNCTION_CONTENT_GRANTS[contentVersionId] ?? [] },
]));

export function getContentPolicy(contentVersionId: string): ContentPolicy | null {
  return CONTENT_POLICIES.get(contentVersionId) ?? null;
}

export function selectContentForSurface<T extends PublishedContent>(
  versions: readonly T[], request: ContentRequest,
): ContentSelection<T> {
  if (!isValidRequest(request)) return { status: 'unknown', reason: 'invalid_request', items: [] };
  const requiresAge = request.context === 'dog_advice' || request.context === 'training_recommendation';
  if (request.ageWeeks === null && requiresAge) return { status: 'unknown', reason: 'missing_age', items: [] };

  const latestByContentId = new Map<string, T>();
  for (const item of versions) {
    if (item.status !== 'published' || !isValidPublishedContent(item)) continue;
    const current = latestByContentId.get(item.contentId);
    if (!current || item.version > current.version || (item.version === current.version && compareLexically(item.id, current.id) < 0)) {
      latestByContentId.set(item.contentId, item);
    }
  }

  const selected: { item: T; priority: number }[] = [];
  for (const item of latestByContentId.values()) {
    const policy = getContentPolicy(item.id);
    if (!policy) return { status: 'unknown', reason: 'unmapped_version', items: [] };
    const grant = policy.grants.find((candidate) => candidate.surface === request.surface
      && candidate.context === request.context
      && candidate.audience === request.audience
      && candidate.need === request.need);
    if (!grant) continue;
    if (request.ageWeeks === null && !grant.ageAgnostic) continue;
    if (request.ageWeeks !== null && (request.ageWeeks < item.minAgeWeeks
      || (item.maxAgeWeeks !== null && request.ageWeeks > item.maxAgeWeeks))) continue;
    if (item.breedIds.length > 0 && !item.breedIds.includes(request.breedId)) continue;
    selected.push({ item, priority: grant.priority });
  }

  selected.sort((left, right) => left.priority - right.priority || compareLexically(left.item.id, right.item.id));
  return selected.length
    ? { status: 'eligible', items: selected.map(({ item }) => item) }
    : { status: 'empty', items: [] };
}

function isValidRequest(request: ContentRequest): boolean {
  if (!request || typeof request !== 'object'
    || typeof request.dogId !== 'string' || !isUuid(request.dogId)
    || typeof request.breedId !== 'string' || !isBreedIdentifier(request.breedId)) return false;
  if (request.ageWeeks !== null && (!Number.isInteger(request.ageWeeks) || request.ageWeeks < 0)) return false;
  if (request.need !== null && !['handling', 'environment', 'being_alone'].includes(request.need)) return false;
  const expected: Partial<Record<ContentSurface, readonly [ContentContext, ContentAudience]>> = {
    home_advice: ['dog_advice', 'dog_owner'],
    knowledge_for_you: ['dog_advice', 'dog_owner'],
    knowledge_articles: ['dog_advice', 'dog_owner'],
    knowledge_faq: ['dog_advice', 'dog_owner'],
    training_recommended: ['training_recommendation', 'dog_owner'],
    training_all: ['training_recommendation', 'dog_owner'],
    log_help: ['log_routines', 'dog_owner'],
    weight_help: ['weight_recording', 'dog_owner'],
    health_help: ['health_recording', 'dog_owner'],
  };
  const match = expected[request.surface];
  return Boolean(match && request.context === match[0] && request.audience === match[1]);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isBreedIdentifier(value: string): boolean {
  // Breed IDs are text keys in the database, not UUIDs. Validate their safe
  // identifier shape here; membership is guaranteed by the dogs.breed_id FK.
  return value === value.trim() && /^[\p{L}\p{N}][\p{L}\p{N} _.-]*$/u.test(value);
}

function isValidPublishedContent(item: PublishedContent): boolean {
  return typeof item.id === 'string' && item.id.length > 0
    && typeof item.contentId === 'string' && item.contentId.length > 0
    && Number.isInteger(item.version) && item.version > 0
    && Number.isInteger(item.minAgeWeeks) && item.minAgeWeeks >= 0
    && (item.maxAgeWeeks === null || (Number.isInteger(item.maxAgeWeeks) && item.maxAgeWeeks >= item.minAgeWeeks))
    && Array.isArray(item.breedIds);
}

function compareLexically(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function selectContent(
  versions: readonly PublishedContent[], ageWeeks: number | null, breedId: string,
): PublishedContent[] {
  if (ageWeeks !== null && (!Number.isInteger(ageWeeks) || ageWeeks < 0)) throw new Error('Invalid age');
  const latest = new Map<string, PublishedContent>();
  for (const item of versions) {
    if (item.status !== 'published') continue;
    if (ageWeeks === null
      ? item.minAgeWeeks !== 0 || item.maxAgeWeeks !== null
      : ageWeeks < item.minAgeWeeks || (item.maxAgeWeeks !== null && ageWeeks > item.maxAgeWeeks)) continue;
    if (item.breedIds.length > 0 && !item.breedIds.includes(breedId)) continue;
    const previous = latest.get(item.contentId);
    if (!previous || item.version > previous.version) latest.set(item.contentId, item);
  }
  return [...latest.values()];
}
