export type GuideBodyBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

/** Parse the small Markdown subset used by content drafts into plain-text UI blocks. */
export function parseGuideBody(body: string): GuideBodyBlock[] {
  const blocks: GuideBodyBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  function flushParagraph() {
    const text = paragraph.join(' ').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    paragraph = [];
  }

  function flushList() {
    if (list.length > 0) blocks.push({ type: 'list', items: list });
    list = [];
  }

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: heading[1].length as 2 | 3, text: heading[2].trim() });
      continue;
    }

    const bullet = /^-\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1].trim());
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

/** Produce a compact plain-text opening snippet without exposing Markdown markers. */
export function getGuidePreviewText(body: string, maxCodePoints = 180): string {
  const blocks = parseGuideBody(body);
  const opening = blocks.find((block) => block.type === 'paragraph')
    ?? blocks.find((block) => block.type === 'list')
    ?? blocks.find((block) => block.type === 'heading');
  const text = opening?.type === 'list' ? opening.items[0] : opening?.text;
  if (!text) return '';
  const characters = Array.from(text.trim());
  return characters.length > maxCodePoints
    ? `${characters.slice(0, Math.max(1, maxCodePoints - 1)).join('')}…`
    : characters.join('');
}
