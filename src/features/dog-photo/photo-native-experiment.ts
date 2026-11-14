/** Synthetic Expo API experiment only. Never connect this adapter to product data. */
import type * as FileSystem from 'expo-file-system';
import type * as SecureStore from 'expo-secure-store';
import type * as Crypto from 'expo-crypto';
import type { PhotoPorts } from './photo-store';

export const FIXTURE_OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const FIXTURE_DOGS = ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'] as const;
export const FIXTURE_PHOTOS = ['cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'] as const;
export const FIXTURE_BYTES = 146_514;
export const FIXTURE_SHA256 = 'aded4dd8109a74d550a63b4e7cd78095a637a4799417b82c362fdad6821120c1';
export const FIXTURE_KEY = 'tassla.synthetic.photo.manifest.v1';
export const FIXTURE_OPTIONS = Object.freeze({ keychainService: 'tassla-synthetic-photo-v1', requireAuthentication: false });
const DIRECTORY_OPTIONS = Object.freeze({ intermediates: false, overwrite: false, idempotent: false });
const PARENT_OPTIONS = Object.freeze({ intermediates: true, overwrite: false, idempotent: true });
const FILE_OPTIONS = Object.freeze({ intermediates: false, overwrite: false });
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const isDog = (value: string) => FIXTURE_DOGS.some((dog) => dog === value);
const isPhoto = (value: string) => uuid(value) && FIXTURE_PHOTOS.some((photo) => photo === value);
const allowed = (owner: string, dog: string, photo: string) => owner === FIXTURE_OWNER && isDog(dog) && isPhoto(photo);
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
function validManifest(raw: string): boolean {
  if (raw.length > 500) return false;
  try {
    const value: unknown = JSON.parse(raw);
    if (!object(value) || Object.keys(value).sort().join(',') !== 'entries,ownerId,version' || value.version !== 1
      || value.ownerId !== FIXTURE_OWNER || !Array.isArray(value.entries) || value.entries.length > FIXTURE_DOGS.length) return false;
    const dogs = new Set<string>();
    for (const entry of value.entries) {
      if (!object(entry) || Object.keys(entry).sort().join(',') !== 'dogId,photoId' || typeof entry.dogId !== 'string'
        || !isDog(entry.dogId) || typeof entry.photoId !== 'string' || !isPhoto(entry.photoId) || dogs.has(entry.dogId)) return false;
      dogs.add(entry.dogId);
    }
    return true;
  } catch { return false; }
}
type Fs = Pick<typeof FileSystem, 'Directory' | 'File' | 'Paths'>;
type Secure = Pick<typeof SecureStore, 'getItemAsync' | 'setItemAsync'>;
type Digest = Pick<typeof Crypto, 'digest' | 'CryptoDigestAlgorithm'>;
let serialTail: Promise<void> = Promise.resolve();
function serial<T>(run: () => Promise<T>): Promise<T> {
  const result = serialTail.then(run, run);
  serialTail = result.then(() => undefined, () => undefined);
  return result;
}
export function createNativePhotoExperiment(fs: Fs, secure: Secure, crypto: Digest) {
  const root = () => new fs.Directory(fs.Paths.document, 'tassla-synthetic-photo-v1', FIXTURE_OWNER);
  const dogDirectory = (dog: string) => new fs.Directory(root(), dog);
  const photoDirectory = (dog: string, photo: string) => new fs.Directory(dogDirectory(dog), photo);
  const file = (dog: string, photo: string) => new fs.File(photoDirectory(dog, photo), 'image.jpg');
  async function correctBytes(bytes: Uint8Array): Promise<boolean> {
    if (!(bytes instanceof Uint8Array) || bytes.length !== FIXTURE_BYTES) return false;
    const digest = new Uint8Array(await crypto.digest(crypto.CryptoDigestAlgorithm.SHA256, Uint8Array.from(bytes).buffer));
    const hex = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return hex === FIXTURE_SHA256;
  }
  async function checkedRead(dog: string, photo: string): Promise<Uint8Array> {
    const target = file(dog, photo), info = target.info();
    if (!info.exists || !Number.isSafeInteger(info.size) || info.size !== FIXTURE_BYTES) throw new Error('Synthetic photo unavailable');
    const bytes = await target.bytes();
    if (!(bytes instanceof Uint8Array) || bytes.length !== info.size) throw new Error('Synthetic photo size mismatch');
    const captured = Uint8Array.from(bytes);
    if (!await correctBytes(captured)) throw new Error('Synthetic photo mismatch');
    return captured;
  }
  const ports: PhotoPorts = {
    async readManifest(owner) {
      if (owner !== FIXTURE_OWNER) return { kind: 'unknown' };
      try {
        const raw = await secure.getItemAsync(FIXTURE_KEY, FIXTURE_OPTIONS);
        return raw !== null && validManifest(raw) ? { kind: 'value', raw } : { kind: 'unknown' };
      } catch { return { kind: 'unknown' }; }
    },
    compareAndSwapManifest(owner, expected, next) {
      return serial(async () => {
        if (owner !== FIXTURE_OWNER || expected === null || !validManifest(expected) || !validManifest(next)) throw new Error('Invalid synthetic manifest');
        const actual = await secure.getItemAsync(FIXTURE_KEY, FIXTURE_OPTIONS);
        if (actual === null || !validManifest(actual)) throw new Error('Synthetic manifest unavailable');
        if (actual !== expected) return 'conflict';
        await secure.setItemAsync(FIXTURE_KEY, next, FIXTURE_OPTIONS);
        if (await secure.getItemAsync(FIXTURE_KEY, FIXTURE_OPTIONS) !== next) throw new Error('Synthetic manifest unverified');
        return 'written';
      });
    },
    async createExclusive(owner, dog, photo, input) {
      if (!allowed(owner, dog, photo) || !(input instanceof Uint8Array) || input.length !== FIXTURE_BYTES) throw new Error('Invalid synthetic input');
      const captured = Uint8Array.from(input);
      if (!await correctBytes(captured)) throw new Error('Invalid synthetic fixture');
      const parent = dogDirectory(dog);
      parent.create(PARENT_OPTIONS);
      const reservation = photoDirectory(dog, photo);
      reservation.create(DIRECTORY_OPTIONS);
      const target = file(dog, photo);
      target.create(FILE_OPTIONS);
      target.write(captured);
      return 'created';
    },
    async readPhoto(owner, dog, photo) {
      if (!allowed(owner, dog, photo)) throw new Error('Invalid synthetic path');
      return checkedRead(dog, photo);
    },
  };
  return {
    ports,
    /** Explicit synthetic bootstrap; null alone does not prove a new installation. */
    bootstrap(): Promise<'observed' | 'conflict' | 'unknown'> {
      return serial(async () => {
        try {
          const existing = await secure.getItemAsync(FIXTURE_KEY, FIXTURE_OPTIONS);
          if (existing !== null) return validManifest(existing) ? 'conflict' : 'unknown';
          const empty = JSON.stringify({ version: 1, ownerId: FIXTURE_OWNER, entries: [] });
          await secure.setItemAsync(FIXTURE_KEY, empty, FIXTURE_OPTIONS);
          return await secure.getItemAsync(FIXTURE_KEY, FIXTURE_OPTIONS) === empty ? 'observed' : 'unknown';
        } catch { return 'unknown'; }
      });
    },
  };
}
