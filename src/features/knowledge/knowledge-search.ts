export interface KnowledgeSearchItem {
  title: string;
  body: string;
}

export function searchKnowledgeItems<T extends KnowledgeSearchItem>(
  eligibleItems: readonly T[],
  query: string,
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('sv-SE');
  if (!normalizedQuery) return [...eligibleItems];

  return eligibleItems.filter((item) =>
    `${item.title}\n${item.body}`.toLocaleLowerCase('sv-SE').includes(normalizedQuery));
}
