import type { HomeContent } from '../../data/app-data';
import { parseGuideBody } from './guide-body';

export type GuideSearchable = Pick<HomeContent, 'title' | 'body'>;

export interface ScopedGuideSearchState {
  scopeKey: string;
  value: string;
}

export function guideSearchScopeKey(sessionKey: string, dogId: string): string {
  return JSON.stringify([sessionKey, dogId]);
}

export function guideSearchValueForScope(
  state: ScopedGuideSearchState,
  scopeKey: string,
): string {
  return state.scopeKey === scopeKey ? state.value : '';
}

export function normalizeGuideSearchText(value: string): string {
  return value.normalize('NFC').toLocaleLowerCase('sv-SE').replace(/\s+/gu, ' ').trim();
}

function getSearchableText(guide: GuideSearchable): string {
  const bodyText = parseGuideBody(guide.body).flatMap((block) => {
    if (block.type === 'list') return block.items;
    return [block.text];
  }).join(' ');
  return normalizeGuideSearchText(guide.title + ' ' + bodyText);
}

export function searchGuideItems<T extends GuideSearchable>(
  items: readonly T[],
  query: string,
): T[] {
  const normalizedQuery = normalizeGuideSearchText(query);
  if (!normalizedQuery) return [...items];
  return items.filter((item) => getSearchableText(item).includes(normalizedQuery));
}
