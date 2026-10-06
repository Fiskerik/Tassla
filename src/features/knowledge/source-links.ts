/** Return a normalized public HTTPS URL, or null so repository references stay plain text. */
export function getSafeContentSourceUrl(source: string): string | null {
  if (typeof source !== 'string' || source.length === 0 || source !== source.trim()) return null;
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}
