// Deno Edge Runtime resolves this exact pinned npm: specifier; node-based eslint cannot resolve Deno imports.
 // eslint-disable-next-line import/no-unresolved
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { createDeleteAccountHandler } from './handler.ts';
import type { AdminDeleteResult, VerifiedUserResult } from './handler.ts';

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};

function statusOf(error: unknown): number | null {
  if (!error || typeof error !== 'object' || !('status' in error)) return null;
  const status = error.status;
  return typeof status === 'number' ? status : null;
}

function isEmptyObject(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype && Object.keys(value).length === 0;
}

const projectUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
let serverClient: ReturnType<typeof createClient> | null = null;
if (projectUrl && serviceRoleKey) {
  try {
    serverClient = createClient(projectUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  } catch {
    serverClient = null;
  }
}

const handler = createDeleteAccountHandler({
  async getUser(accessToken): Promise<VerifiedUserResult> {
    if (!serverClient) return { kind: 'unknown' };
    try {
      const { data, error } = await serverClient.auth.getUser(accessToken);
      if (error) {
        const status = statusOf(error);
        return status !== null && [400, 401, 403].includes(status)
          ? { kind: 'unauthorized' }
          : { kind: 'unknown' };
      }
      return data.user?.id ? { kind: 'verified', userId: data.user.id } : { kind: 'unknown' };
    } catch {
      return { kind: 'unknown' };
    }
  },
  async deleteUser(verifiedUserId): Promise<AdminDeleteResult> {
    if (!serverClient) return 'unknown';
    try {
      const { data, error } = await serverClient.auth.admin.deleteUser(verifiedUserId, false);
      if (error) {
        const status = statusOf(error);
        return status !== null && [400, 401, 403].includes(status) ? 'failed' : 'unknown';
      }
      return data && isEmptyObject(data.user) ? 'confirmed' : 'unknown';
    } catch {
      return 'unknown';
    }
  },
});

Deno.serve(handler);
