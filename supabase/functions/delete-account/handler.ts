export type VerifiedUserResult =
  | { kind: 'verified'; userId: string }
  | { kind: 'unauthorized' }
  | { kind: 'unknown' };

export type AdminDeleteResult = 'confirmed' | 'failed' | 'unknown';

export interface DeleteAccountDependencies {
  getUser(accessToken: string): Promise<VerifiedUserResult>;
  deleteUser(verifiedUserId: string): Promise<AdminDeleteResult>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BEARER_LENGTH = 8192;

function json(status: number, body: { status: string }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export function createDeleteAccountHandler(dependencies: DeleteAccountDependencies): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return json(405, { status: 'method_not_allowed' });

    let requestUrl: URL;
    try {
      requestUrl = new URL(request.url);
    } catch {
      return json(400, { status: 'invalid_request' });
    }
    if (requestUrl.search !== '') return json(400, { status: 'invalid_request' });

    const authorization = request.headers.get('authorization');
    const match = authorization && /^Bearer ([^\s,]+)$/i.exec(authorization);
    if (!match || match[1].length > MAX_BEARER_LENGTH) return json(401, { status: 'unauthorized' });
    if (request.body !== null) return json(400, { status: 'invalid_request' });

    let verified: VerifiedUserResult;
    try {
      verified = await dependencies.getUser(match[1]);
    } catch {
      return json(503, { status: 'unknown' });
    }
    if (verified.kind === 'unauthorized') return json(401, { status: 'unauthorized' });
    if (verified.kind !== 'verified' || !UUID_PATTERN.test(verified.userId)) return json(503, { status: 'unknown' });

    let deletion: AdminDeleteResult;
    try {
      deletion = await dependencies.deleteUser(verified.userId);
    } catch {
      return json(503, { status: 'unknown' });
    }
    if (deletion === 'confirmed') return json(200, { status: 'deleted' });
    if (deletion === 'failed') return json(409, { status: 'failed' });
    return json(503, { status: 'unknown' });
  };
}
