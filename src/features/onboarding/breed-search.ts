import type { BreedOption } from '../../data/app-data';

export function normalizeBreedSearchText(value: string): string {
  return value.normalize('NFC').trim().toLocaleLowerCase('sv-SE');
}

export function filterBreedsByQuery(breeds: readonly BreedOption[], query: string): readonly BreedOption[] {
  const normalizedQuery = normalizeBreedSearchText(query);
  if (!normalizedQuery) return breeds;
  return breeds.filter((breed) => normalizeBreedSearchText(breed.name).includes(normalizedQuery));
}

export function findUnknownBreed(breeds: readonly BreedOption[]): BreedOption | undefined {
  return breeds.find((breed) => normalizeBreedSearchText(breed.name) === normalizeBreedSearchText('Okänd ras'));
}
