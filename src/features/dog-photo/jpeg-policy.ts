/** Strict structural screening of a processed JPEG copy, not a JPEG decoder. */
export type JpegLimits = { maxBytes: number; maxPixels: number; maxDimension: number };
export type JpegPolicyResult = { ok: true; width: number; height: number } | { ok: false; reason: string };
const reject = (reason: string): JpegPolicyResult => ({ ok: false, reason });
const word = (bytes: Uint8Array, index: number) => bytes[index] * 256 + bytes[index + 1];

export function inspectProcessedJpeg(bytes: Uint8Array, limits: JpegLimits): JpegPolicyResult {
  if (!(bytes instanceof Uint8Array) || !limits || !Number.isSafeInteger(limits.maxBytes) || limits.maxBytes < 4 || limits.maxBytes > 16_000_000
    || !Number.isSafeInteger(limits.maxPixels) || limits.maxPixels < 1 || limits.maxPixels > 100_000_000
    || !Number.isSafeInteger(limits.maxDimension) || limits.maxDimension < 1 || limits.maxDimension > 65_535) return reject('invalid-input');
  if (bytes.length > limits.maxBytes || bytes.length < 4) return reject('size');
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return reject('missing-soi');
  let offset = 2, width = 0, height = 0, frame = 0, scans = 0, segments = 0, restartInterval = 0;
  let jfif = false, hasDqt = false, hasDht = false, entropy = false, scanData = false, expectedRestart = 0;
  const componentIds = new Set<number>(), quantIds = new Set<number>(), dcIds = new Set<number>(), acIds = new Set<number>();
  const componentQuant = new Map<number, number>();
  while (offset < bytes.length) {
    if (entropy && bytes[offset] !== 0xff) { scanData = true; offset += 1; continue; }
    if (bytes[offset] !== 0xff) return reject('marker');
    offset += 1;
    let fills = 0;
    while (offset < bytes.length && bytes[offset] === 0xff) { fills += 1; offset += 1; }
    if (offset >= bytes.length) return reject('truncated-marker');
    const marker = bytes[offset++];
    if (entropy && marker === 0x00) {
      if (fills) return reject('invalid-stuffing');
      scanData = true;
      continue;
    }
    if (entropy && marker >= 0xd0 && marker <= 0xd7) {
      if (!restartInterval || !scanData || marker !== 0xd0 + expectedRestart) return reject('restart');
      expectedRestart = (expectedRestart + 1) % 8;
      scanData = false;
      continue;
    }
    if (entropy) {
      if (!scanData) return reject('empty-scan');
      entropy = false;
    }
    if (marker === 0xd9) {
      return offset === bytes.length && frame && scans && hasDqt && hasDht
        ? { ok: true, width, height } : reject('invalid-eoi');
    }
    if (marker === 0x00 || marker === 0xd8 || marker >= 0xd0 && marker <= 0xd7 || marker === 0x01) return reject('standalone-marker');
    if (++segments > 1024 || offset + 2 > bytes.length) return reject('segment-limit');
    const length = word(bytes, offset);
    if (length < 2 || offset + length > bytes.length) return reject('segment-length');
    const start = offset + 2, end = offset + length;
    if (marker === 0xe0) {
      if (jfif || frame || scans || length !== 16 || bytes[start] !== 0x4a || bytes[start + 1] !== 0x46
        || bytes[start + 2] !== 0x49 || bytes[start + 3] !== 0x46 || bytes[start + 4] !== 0
        || bytes[start + 5] !== 1 || bytes[start + 6] > 2 || bytes[start + 7] > 2
        || word(bytes, start + 8) === 0 || word(bytes, start + 10) === 0 || bytes[start + 12] !== 0 || bytes[start + 13] !== 0) return reject('jfif');
      jfif = true;
    } else if (marker === 0xc0 || marker === 0xc2) {
      if (frame || scans || length < 11 || bytes[start] !== 8) return reject('frame');
      height = word(bytes, start + 1); width = word(bytes, start + 3);
      const components = bytes[start + 5];
      if ((components !== 1 && components !== 3) || length !== 8 + 3 * components || !width || !height
        || width > limits.maxDimension || height > limits.maxDimension || width * height > limits.maxPixels) return reject('dimensions');
      for (let i = 0; i < components; i += 1) {
        const at = start + 6 + i * 3, id = bytes[at], sampling = bytes[at + 1], quant = bytes[at + 2];
        if (componentIds.has(id) || !(sampling >> 4) || (sampling >> 4) > 4 || !(sampling & 15) || (sampling & 15) > 4 || quant > 3) return reject('component');
        componentIds.add(id);
        componentQuant.set(id, quant);
      }
      frame = marker;
    } else if (marker === 0xdb) {
      let at = start;
      while (at < end) {
        const info = bytes[at++], precision = info >> 4;
        if (precision > 1 || (info & 15) > 3 || at + (precision ? 128 : 64) > end) return reject('quantization');
        const bytesPerValue = precision ? 2 : 1;
        for (let i = 0; i < 64; i += 1) {
          const value = bytesPerValue === 2 ? word(bytes, at + i * 2) : bytes[at + i];
          if (value === 0) return reject('quantization');
        }
        quantIds.add(info & 15);
        at += 64 * bytesPerValue;
      }
      if (at !== end || start === end) return reject('quantization');
      hasDqt = true;
    } else if (marker === 0xc4) {
      let at = start;
      while (at < end) {
        const info = bytes[at++];
        if ((info >> 4) > 1 || (info & 15) > 3 || at + 16 > end) return reject('huffman');
        let symbols = 0, available = 1;
        for (let i = 0; i < 16; i += 1) {
          symbols += bytes[at + i];
          available = available * 2 - bytes[at + i];
          if (available < 0) return reject('huffman');
        }
        at += 16;
        if (!symbols || symbols > 256 || at + symbols > end) return reject('huffman');
        at += symbols;
        (info >> 4 ? acIds : dcIds).add(info & 15);
      }
      if (at !== end || start === end) return reject('huffman');
      hasDht = true;
    } else if (marker === 0xdd) {
      if (length !== 4) return reject('restart-interval');
      restartInterval = word(bytes, start);
    } else if (marker === 0xda) {
      if (!frame || !hasDqt || !hasDht || ++scans > 64 || length < 8) return reject('scan');
      const count = bytes[start];
      if (!count || count > componentIds.size || length !== 6 + 2 * count) return reject('scan-components');
      const spectralStart = bytes[end - 3], spectralEnd = bytes[end - 2], approximation = bytes[end - 1];
      const seen = new Set<number>();
      for (let i = 0; i < count; i += 1) {
        const id = bytes[start + 1 + 2 * i], selectors = bytes[start + 2 + 2 * i];
        if (!componentIds.has(id) || seen.has(id) || (selectors >> 4) > 3 || (selectors & 15) > 3
          || !quantIds.has(componentQuant.get(id) ?? -1)
          || ((frame === 0xc0 || spectralStart === 0) && !dcIds.has(selectors >> 4))
          || ((frame === 0xc0 || spectralStart > 0) && !acIds.has(selectors & 15))) return reject('scan-components');
        seen.add(id);
      }
      if (frame === 0xc0 ? spectralStart !== 0 || spectralEnd !== 63 || approximation !== 0
        : spectralStart > spectralEnd || spectralEnd > 63 || (spectralStart === 0 && spectralEnd !== 0)
          || (spectralStart > 0 && count !== 1) || (approximation >> 4) > 13 || (approximation & 15) > 13
          || ((approximation >> 4) !== 0 && (approximation >> 4) !== (approximation & 15) + 1)) return reject('scan-parameters');
      entropy = true; scanData = false; expectedRestart = 0;
    } else return reject('unsupported-marker');
    offset = end;
  }
  return reject('missing-eoi');
}
