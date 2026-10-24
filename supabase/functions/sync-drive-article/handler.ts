export function createArticleSyncHandler(config: {
  token: string | undefined;
  publish: (article: unknown) => Promise<boolean>;
}) {
  return async (request: Request): Promise<Response> => {
    const reply = (status: number) => new Response(JSON.stringify({ ok: status === 200 }), {
      status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
    if (request.method !== 'POST') return reply(405);
    if (!config.token || config.token.length < 32) return reply(503);
    const provided = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
    if (provided.length > 256) return reply(401);
    const hash = async (value: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
    const expected = await hash(config.token);
    const actual = await hash(provided);
    let difference = 0;
    for (let i = 0; i < expected.length; i++) difference |= expected[i] ^ actual[i];
    if (difference !== 0) return reply(401);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return reply(415);
    // Bound the stream even when content-length is absent or misleading.
    const reader = request.body?.getReader();
    if (!reader) return reply(400);
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        length += next.value.byteLength;
        if (length > 500_000) { await reader.cancel(); return reply(413); }
        chunks.push(next.value);
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
      if (!payload || typeof payload !== 'object' || !('article' in payload) || Object.keys(payload).length !== 1) return reply(400);
      return reply(await config.publish(payload.article) ? 200 : 422);
    } catch { return reply(400); }
    finally { reader.releaseLock(); }
  };
}
