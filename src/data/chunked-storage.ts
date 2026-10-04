export interface SecureKeyValueStore {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

const MAX_CHUNK_BYTES = 1_500;
const MAX_CHUNKS = 128;

type Slot = 'a' | 'b';

export function createChunkedStorage(store: SecureKeyValueStore) {
  async function clearSlot(key: string, slot: Slot): Promise<void> {
    for (let index = 0; index < MAX_CHUNKS; index += 1) {
      const name = chunkKey(key, slot, index);
      if (await store.getItemAsync(name) !== null) await store.deleteItemAsync(name);
    }
  }

  return {
    async getItem(key: string): Promise<string | null> {
      const marker = await store.getItemAsync(markerKey(key));
      if (marker === null) return null;

      const parsed = parseMarker(marker);
      if (!parsed) throw new Error('Secure session storage is incomplete');

      const chunks: string[] = [];
      for (let index = 0; index < parsed.count; index += 1) {
        const chunk = await store.getItemAsync(chunkKey(key, parsed.slot, index));
        if (chunk === null) throw new Error('Secure session storage is incomplete');
        chunks.push(chunk);
      }
      return chunks.join('');
    },

    async setItem(key: string, value: string): Promise<void> {
      const markerName = markerKey(key);
      const existingMarker = await store.getItemAsync(markerName);
      const existing = existingMarker === null ? null : parseMarker(existingMarker);
      const nextSlot: Slot = existing?.slot === 'a' ? 'b' : 'a';
      const chunks = splitValue(value);

      try {
        for (let index = 0; index < chunks.length; index += 1) {
          await store.setItemAsync(chunkKey(key, nextSlot, index), chunks[index]);
        }
        await store.setItemAsync(markerName, `v1|${nextSlot}|${chunks.length}`);
      } catch (error) {
        await clearSlot(key, nextSlot).catch(() => undefined);
        throw error;
      }

      if (existing) await clearSlot(key, existing.slot).catch(() => undefined);
    },

    async removeItem(key: string): Promise<void> {
      await store.deleteItemAsync(markerKey(key));
      await Promise.all([clearSlot(key, 'a'), clearSlot(key, 'b')]);
    },
  };
}

function splitValue(value: string): string[] {
  const chunks: string[] = [];
  let current = '';
  let byteLength = 0;

  for (const character of value) {
    const characterBytes = utf8ByteLength(character.codePointAt(0) ?? 0);
    if (byteLength + characterBytes > MAX_CHUNK_BYTES) {
      chunks.push(current);
      current = '';
      byteLength = 0;
    }
    current += character;
    byteLength += characterBytes;
  }
  if (current.length > 0 || chunks.length === 0) chunks.push(current);
  if (chunks.length > MAX_CHUNKS) throw new Error('Secure session value is too large');
  return chunks;
}

function utf8ByteLength(codePoint: number): number {
  if (codePoint <= 0x7f) return 1;
  if (codePoint <= 0x7ff) return 2;
  if (codePoint <= 0xffff) return 3;
  return 4;
}

function parseMarker(value: string): { slot: Slot; count: number } | null {
  const match = /^v1\|([ab])\|(\d+)$/.exec(value);
  if (!match) return null;
  const count = Number(match[2]);
  if (!Number.isInteger(count) || count < 1 || count > MAX_CHUNKS) return null;
  return { slot: match[1] as Slot, count };
}

function markerKey(key: string): string {
  return `${key}.index`;
}

function chunkKey(key: string, slot: Slot, index: number): string {
  return `${key}.chunk.${slot}.${index}`;
}
