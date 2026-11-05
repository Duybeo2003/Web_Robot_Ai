/** Client-safe allowlist, shared by the login return and server authorization route. */
export type MobileAuthorization = {
  response_type: 'code'; client_id: 'roboeq-mobile'; redirect_uri: 'roboeq://auth/callback';
  code_challenge: string; code_challenge_method: 'S256'; state: string;
};
export function parseAuthorization(params: URLSearchParams): MobileAuthorization {
  const allowed = new Set(['response_type','client_id','redirect_uri','code_challenge',
    'code_challenge_method','state','scope']);
  for (const key of params.keys()) {
    if (!allowed.has(key) || params.getAll(key).length !== 1) throw new Error('Invalid authorization');
  }
  if (params.get('response_type') !== 'code' || params.get('client_id') !== 'roboeq-mobile' ||
    params.get('redirect_uri') !== 'roboeq://auth/callback' || params.get('code_challenge_method') !== 'S256' ||
    !/^[A-Za-z0-9_-]{43}$/.test(params.get('code_challenge') ?? '') ||
    !/^[A-Za-z0-9._~-]{22,256}$/.test(params.get('state') ?? '')) throw new Error('Invalid authorization');
  const scope = params.get('scope');
  if (scope !== null && !/^(parent:read|parent:write)( (parent:read|parent:write))*$/.test(scope)) {
    throw new Error('Invalid authorization');
  }
  return {response_type:'code',client_id:'roboeq-mobile',redirect_uri:'roboeq://auth/callback',
    code_challenge:params.get('code_challenge')!,code_challenge_method:'S256',state:params.get('state')!};
}
export function safeMobileReturnPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/mobile/authorize?') ||
    /[#\\\s\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value,'https://return.invalid');
    if (url.origin !== 'https://return.invalid' || url.pathname !== '/mobile/authorize') return null;
    parseAuthorization(url.searchParams);
    return url.pathname + url.search;
  } catch { return null; }
}
