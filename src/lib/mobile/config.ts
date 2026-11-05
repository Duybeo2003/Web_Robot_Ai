import 'server-only';
import { readFileSync, statSync } from 'node:fs';
import { createPrivateKey } from 'node:crypto';
import type { SigningConfig } from './protocol';
export type MobileConfig = SigningConfig & {parentOrigin: string; statusToken: string};
function origin(value: string | undefined): string {
  if (!value || !/^[\x21-\x7e]+$/.test(value) || value.includes('?') || value.includes('#')) throw new Error();
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || !url.hostname ||
    !['','/'].includes(url.pathname)) throw new Error();
  return url.origin;
}
export function loadMobileConfig(env: Record<string,string|undefined> = process.env): MobileConfig | null {
  if (env.MOBILE_BRIDGE_ENABLED !== 'true') return null;
  try {
    const file=env.MOBILE_SIGNING_KEY_FILE;
    if (!file || statSync(file).size > 16384) throw new Error();
    const privateKey=readFileSync(file,'utf8');
    const key=createPrivateKey(privateKey);
    const kid=env.MOBILE_SIGNING_KID ?? '',statusToken=env.MOBILE_STATUS_TOKEN ?? '';
    if (key.asymmetricKeyType !== 'rsa' || (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048 ||
      !/^[A-Za-z0-9_-]{1,64}$/.test(kid) || !/^[A-Za-z0-9_-]{43,256}$/.test(statusToken)) throw new Error();
    return {issuer:origin(env.MOBILE_IDENTITY_ISSUER),parentOrigin:origin(env.MOBILE_PARENT_ORIGIN),
      privateKey,kid,statusToken};
  } catch { throw new Error('Mobile sign-in is unavailable'); }
}
