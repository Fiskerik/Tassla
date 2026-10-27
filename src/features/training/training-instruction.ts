export type TrainingInstructionBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ordered'; items: { number: string; text: string }[] };

/** Parse the small, text-only subset used by training instructions. */
export function parseTrainingInstruction(instruction: string): TrainingInstructionBlock[] {
  const blocks: TrainingInstructionBlock[] = [];
  let paragraph: string[] = [];
  let ordered: { number: string; text: string }[] = [];
  const flushParagraph = () => {
    const text = paragraph.join('\n').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    paragraph = [];
  };
  const flushOrdered = () => {
    if (ordered.length) blocks.push({ type: 'ordered', items: ordered });
    ordered = [];
  };
  for (const raw of instruction.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { flushParagraph(); flushOrdered(); continue; }
    const heading = /^#{2,3}\s+(.+)$/.exec(line);
    if (heading) { flushParagraph(); flushOrdered(); blocks.push({ type: 'heading', text: heading[1].trim() }); continue; }
    const item = /^(\d+)[.)]\s+(.+)$/.exec(line);
    if (item) { flushParagraph(); ordered.push({ number: item[1], text: item[2].trim() }); continue; }
    flushOrdered();
    paragraph.push(line);
  }
  flushParagraph(); flushOrdered();
  return blocks;
}

export function trainingInstructionPreview(instruction: string): string {
  const blocks = parseTrainingInstruction(instruction);
  if (blocks[0]?.type === 'paragraph') return blocks[0].text.replace(/\s+/g, ' ');
  const list = blocks.find((block) => block.type === 'ordered');
  if (list?.type === 'ordered') return list.items[0]?.text ?? '';
  const paragraph = blocks.find((block) => block.type === 'paragraph');
  if (paragraph?.type === 'paragraph') return paragraph.text.replace(/\s+/g, ' ');
  return '';
}
