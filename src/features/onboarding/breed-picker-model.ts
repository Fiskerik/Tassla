import type { BreedOption } from '../../data/app-data';

const mixedBreedId = 'mixed';
const breedCollator = new Intl.Collator('sv-SE', { sensitivity: 'base', numeric: true });

export function sortBreedOptions(breeds: readonly BreedOption[]): BreedOption[] {
  return [...breeds].sort((left, right) => {
    if (left.id === mixedBreedId) return right.id === mixedBreedId ? 0 : -1;
    if (right.id === mixedBreedId) return 1;
    return breedCollator.compare(left.name, right.name) || left.id.localeCompare(right.id);
  });
}

export function filterBreedOptions(breeds: readonly BreedOption[], query: string): BreedOption[] {
  const normalizedQuery = normalizeBreedSearch(query);
  const sortedBreeds = sortBreedOptions(breeds);
  if (!normalizedQuery) return sortedBreeds;
  return sortedBreeds.filter((breed) => normalizeBreedSearch(breed.name).includes(normalizedQuery));
}

function normalizeBreedSearch(value: string): string {
  return value.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('sv-SE');
}
