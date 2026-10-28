export function developmentTitle(dogName: string): string {
  const name = dogName.trim();
  const genitiveEnding = name.toLowerCase().endsWith('s') ? '' : 's';
  return `${name}${genitiveEnding} utveckling`;
}
