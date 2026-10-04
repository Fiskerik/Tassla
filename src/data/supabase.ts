import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { secureSessionStorage } from './secure-session-storage';
import { installExpoPkceCrypto } from './expo-pkce-crypto';

let client: SupabaseClient | null = null;

export function getSupabaseProjectUrl(): string {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (!url) throw new Error('Supabase configuration is missing');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error('Supabase URL must use HTTPS');
  }
  return parsed.toString().replace(/\/$/, '');
}

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  installExpoPkceCrypto();
  const url = getSupabaseProjectUrl();
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) throw new Error('Supabase configuration is missing');

  client = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: true,
      storage: secureSessionStorage,
      flowType: 'pkce',
    },
  });
  return client;
}
