export type KnowledgeImageFocus = { x: number; y: number; zoom: number; aspectRatio: number };

export type KnowledgeImageLayout = { left: number; top: number; width: number; height: number };

export function knowledgeImageLayout(
  frameWidth: number,
  frameHeight: number,
  sourceWidth: number,
  sourceHeight: number,
  focus: KnowledgeImageFocus,
): KnowledgeImageLayout | null {
  if (![frameWidth, frameHeight, sourceWidth, sourceHeight].every((value) => Number.isFinite(value) && value > 0)) return null;

  const zoom = Math.max(1, Number.isFinite(focus.zoom) ? focus.zoom : 1);
  const scale = Math.max(frameWidth / sourceWidth, frameHeight / sourceHeight) * zoom;
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const focalX = clamp(focus.x, 0, 1);
  const focalY = clamp(focus.y, 0, 1);

  return {
    left: clamp(frameWidth / 2 - focalX * width, frameWidth - width, 0),
    top: clamp(frameHeight / 2 - focalY * height, frameHeight - height, 0),
    width,
    height,
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}
