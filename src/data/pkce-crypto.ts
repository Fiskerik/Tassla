type IntegerTypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array;

export interface PkceCryptoProvider {
  getRandomValues<T extends IntegerTypedArray>(array: T): T;
  digest(algorithm: 'SHA-256', data: BufferSource): Promise<ArrayBuffer>;
}

interface CryptoTarget {
  crypto?: Crypto;
}

export function createPkceWebCryptoAdapter(provider: PkceCryptoProvider): Crypto {
  return {
    getRandomValues<T extends ArrayBufferView<ArrayBuffer>>(array: T): T {
      if (!isIntegerTypedArray(array)) throw new Error('Unsupported secure random array');
      return provider.getRandomValues(array) as T;
    },
    subtle: {
      digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> {
        if (algorithm !== 'SHA-256') throw new Error('Unsupported PKCE digest');
        return provider.digest('SHA-256', data);
      },
    },
  } as unknown as Crypto;
}

export function installPkceWebCrypto(target: CryptoTarget, provider: PkceCryptoProvider): void {
  if (hasPkceWebCrypto(target.crypto)) return;
  const adapter = createPkceWebCryptoAdapter(provider);
  try {
    Object.defineProperty(target, 'crypto', { configurable: true, enumerable: true, value: adapter, writable: true });
  } catch {
    throw new Error('Secure authentication cryptography is unavailable');
  }
  if (!hasPkceWebCrypto(target.crypto)) throw new Error('Secure authentication cryptography is unavailable');
}

export async function verifyPkceWebCrypto(target: CryptoTarget = globalThis): Promise<void> {
  const crypto = target.crypto;
  if (!hasPkceWebCrypto(crypto) || typeof TextEncoder === 'undefined') {
    throw new Error('Secure authentication cryptography is unavailable');
  }
  try {
    crypto.getRandomValues(new Uint32Array(2));
    const digest = await crypto.subtle.digest('SHA-256', new Uint8Array([0x54, 0x61, 0x73, 0x73, 0x6c, 0x61]));
    if (!(digest instanceof ArrayBuffer) || digest.byteLength !== 32) throw new Error('Invalid digest result');
  } catch {
    throw new Error('Secure authentication cryptography is unavailable');
  }
}

function hasPkceWebCrypto(value: Crypto | undefined): value is Crypto {
  return Boolean(value && typeof value.getRandomValues === 'function'
    && value.subtle && typeof value.subtle.digest === 'function');
}

function isIntegerTypedArray(value: ArrayBufferView): value is IntegerTypedArray {
  return value instanceof Int8Array || value instanceof Uint8Array || value instanceof Uint8ClampedArray
    || value instanceof Int16Array || value instanceof Uint16Array || value instanceof Int32Array || value instanceof Uint32Array;
}
