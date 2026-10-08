import * as SecureStore from 'expo-secure-store';
import { clearPendingReferral, readPendingReferral, savePendingReferral } from './referral-storage';

const storage = {
  getItemAsync: SecureStore.getItemAsync,
  setItemAsync: SecureStore.setItemAsync,
  deleteItemAsync: SecureStore.deleteItemAsync,
};

export const saveSecurePendingReferral = (code: string, capturedAt?: number) =>
  savePendingReferral(storage, code, capturedAt);
export const readSecurePendingReferral = (now?: number) => readPendingReferral(storage, now);
export const clearSecurePendingReferral = () => clearPendingReferral(storage);
