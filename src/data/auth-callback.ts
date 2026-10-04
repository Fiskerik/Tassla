export const AUTH_CALLBACK_URL = 'tassla://auth/callback';

export function isTrustedGoogleOAuthUrl(value: string, projectUrl: string): boolean {
  try {
    const target = new URL(value);
    const project = new URL(projectUrl);
    const projectPath = project.pathname.replace(/\/+$/, '');
    const providers = target.searchParams.getAll('provider');
    const redirects = target.searchParams.getAll('redirect_to');
    const challenges = target.searchParams.getAll('code_challenge');
    const challengeMethods = target.searchParams.getAll('code_challenge_method');
    return project.protocol === 'https:'
      && project.username === ''
      && project.password === ''
      && project.port === ''
      && (projectPath === '' || projectPath === '/')
      && target.protocol === 'https:'
      && target.origin === project.origin
      && target.username === ''
      && target.password === ''
      && target.port === ''
      && target.pathname === `${projectPath}/auth/v1/authorize`
      && providers.length === 1
      && providers[0] === 'google'
      && redirects.length === 1
      && redirects[0] === AUTH_CALLBACK_URL
      && challenges.length === 1
      && /^[A-Za-z0-9_-]{43}$/.test(challenges[0])
      && challengeMethods.length === 1
      && challengeMethods[0] === 's256'
      && target.hash === '';
  } catch {
    return false;
  }
}

export function shouldExchangeAuthCode(
  code: string | null,
  inFlightCode: string | null,
  failedCode: string | null,
  exchangedCode: string | null,
): code is string {
  return Boolean(code) && !inFlightCode && code !== failedCode && code !== exchangedCode;
}

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
