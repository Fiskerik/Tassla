export interface PublishedContent {
  id: string;
  contentId: string;
  version: number;
  status: 'published';
  minAgeWeeks: number;
  maxAgeWeeks: number | null;
  breedIds: readonly string[];
}

export function selectContent(
  versions: readonly PublishedContent[], ageWeeks: number, breedId: string,
): PublishedContent[] {
  if (!Number.isInteger(ageWeeks) || ageWeeks < 0) throw new Error('Invalid age');
  const latest = new Map<string, PublishedContent>();
  for (const item of versions) {
    if (item.status !== 'published') continue;
    if (ageWeeks < item.minAgeWeeks || (item.maxAgeWeeks !== null && ageWeeks > item.maxAgeWeeks)) continue;
    if (item.breedIds.length > 0 && !item.breedIds.includes(breedId)) continue;
    const previous = latest.get(item.contentId);
    if (!previous || item.version > previous.version) latest.set(item.contentId, item);
  }
  return [...latest.values()];
}
