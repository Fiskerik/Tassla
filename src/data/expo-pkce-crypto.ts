import * as ExpoCrypto from 'expo-crypto';
import { CryptoDigestAlgorithm } from 'expo-crypto';
import { installPkceWebCrypto, type PkceCryptoProvider } from './pkce-crypto';

const provider: PkceCryptoProvider = {
  getRandomValues<T extends Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array>(array: T): T {
    return ExpoCrypto.getRandomValues(array as Uint8Array) as T;
  },
  digest(algorithm, data) {
    if (algorithm !== 'SHA-256') throw new Error('Unsupported PKCE digest');
    return ExpoCrypto.digest(CryptoDigestAlgorithm.SHA256, data);
  },
};

export function installExpoPkceCrypto(): void {
  installPkceWebCrypto(globalThis, provider);
}
