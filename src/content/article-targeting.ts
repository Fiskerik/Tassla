export type ArticleRule = {
  rule_key: string;
  min_age_weeks: number;
  max_age_weeks: number | null;
  event_kind: 'none' | 'expected_homecoming';
  start_days: number | null;
  end_days: number | null;
};

export function validCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

export function matchesArticleRules(rules: unknown, ageWeeks: number | null, expectedDate: string | null, today: string): boolean {
  if (!Array.isArray(rules) || !validCalendarDate(today)) return false;
  return rules.some((rule) => {
    if (!rule || typeof rule !== 'object') return false;
    const { min_age_weeks: min, max_age_weeks: max, event_kind: event, start_days: start, end_days: end } = rule;
    if (!Number.isInteger(min) || min < 0 || (max !== null && (!Number.isInteger(max) || max < min))) return false;
    if (ageWeeks === null ? min !== 0 || max !== null : ageWeeks < min || (max !== null && ageWeeks > max)) return false;
    if (event === 'none') return start === null && end === null;
    if (event !== 'expected_homecoming' || !validCalendarDate(expectedDate)
      || !Number.isInteger(start) || !Number.isInteger(end) || start < -365 || end < start || end > 0) return false;
    // UTC midnights compare date labels, avoiding local DST-length days.
    const days = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${expectedDate}T00:00:00Z`)) / 86_400_000;
    return days >= start && days <= end;
  });
}

export type DogSex = 'male' | 'female';
const TOKEN = /\{\{dog\.(name|genitive|subject|Subject|object)\}\}/g;

/** Expand explicit editorial tokens once; never replace arbitrary nouns or evaluate markup. */
export function personalizeArticle(text: string, dog: { name: string; sex?: DogSex | null }): string {
  const name = dog.name.trim() || 'hunden';
  const subject = dog.sex === 'male' ? 'han' : dog.sex === 'female' ? 'hon' : name;
  const values = {
    name,
    genitive: /[sxz]$/i.test(name) ? name : `${name}s`,
    subject,
    Subject: subject.charAt(0).toLocaleUpperCase('sv-SE') + subject.slice(1),
    object: dog.sex === 'male' ? 'honom' : dog.sex === 'female' ? 'henne' : name,
  };
  return text.replace(TOKEN, (_, key: keyof typeof values) => values[key]);
}
