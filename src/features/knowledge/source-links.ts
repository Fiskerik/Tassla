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

const REVIEWED_SOURCE_TITLES: Readonly<Record<string, string>> = {
  'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/health/puppycare': 'Caring For Your Puppy - 6 weeks to 12 months',
  'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/environment': 'Creating a Good Home For Your Dog',
  'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/leftalone': 'How to Train Your Dog to Stay Home Alone',
  'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/come': 'Train Your Dog To Come When Called',
  'https://www.dogstrust.org.uk/dog-advice/training/home/create-routine': 'How to get your dog into a routine',
  'https://avsab.org/wp-content/uploads/2021/08/AVSAB-Humane-Dog-Training-Position-Statement-2021.pdf': 'Position Statement on Humane Dog Training',
  'https://avsab.org/wp-content/uploads/2024/12/Puppy-Socialization-Position-Statement-FINAL.pdf': 'AVSAB Puppy Socialization Position Statement',
};

export interface ContentSourceMetadata { url: string; title: string; publisher: string; }

/** Resolve only URLs with reviewed title metadata and a recognized exact publisher host. */
export function getContentSourceMetadata(source: string): ContentSourceMetadata | null {
  const url = getSafeContentSourceUrl(source);
  if (!url) return null;
  const title = REVIEWED_SOURCE_TITLES[url];
  if (!title) return null;
  const hostname = new URL(url).hostname.replace(/^www\./, '');
  const publishers: Readonly<Record<string, string>> = {
    'rspca.org.uk': 'RSPCA',
    'dogstrust.org.uk': 'Dogs Trust',
    'avsab.org': 'AVSAB',
  };
  const publisher = publishers[hostname];
  return publisher ? { url, title, publisher } : null;
}
