import * as SecureStore from 'expo-secure-store';
import { createChunkedStorage } from './chunked-storage';

export const secureSessionStorage = createChunkedStorage(SecureStore);
