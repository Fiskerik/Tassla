import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { createArticleSyncHandler } from './handler.ts';

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};

const url = Deno.env.get('SUPABASE_URL');
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const client = url && key ? createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
}) : null;
Deno.serve(createArticleSyncHandler({
  token: Deno.env.get('ARTICLE_SYNC_TOKEN'),
  async publish(article) {
    if (!client) return false;
    const { data, error } = await client.rpc('import_drive_article', { article }).abortSignal(AbortSignal.timeout(20_000));
    return !error && typeof data === 'string';
  },
}));
