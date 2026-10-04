export const AUTH_CALLBACK_URL = 'tassla://auth/callback';

export function readAuthCode(url: string): string | null {
  try {
    const parsed = new URL(url);
    const codes = parsed.searchParams.getAll('code');
    if (
      parsed.protocol !== 'tassla:' ||
      parsed.hostname !== 'auth' ||
      parsed.pathname !== '/callback' ||
      parsed.username !== '' ||
      parsed.password !== '' ||
      parsed.port !== '' ||
      parsed.hash !== '' ||
      [...parsed.searchParams.keys()].some((key) => key !== 'code') ||
      codes.length !== 1 ||
      !codes[0]
    ) return null;
    return codes[0];
  } catch {
    return null;
  }
}
