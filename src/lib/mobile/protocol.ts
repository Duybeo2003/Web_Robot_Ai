import { createHash, randomBytes, createPrivateKey } from 'node:crypto';
import { SignJWT } from 'jose';
import type { MobileAuthorization } from './return-path';
export type SigningConfig = {issuer: string; kid: string; privateKey: string};
export function requestHash(value: MobileAuthorization): string {
  return createHash('sha256').update(JSON.stringify([value.client_id,value.redirect_uri,
    value.code_challenge,value.code_challenge_method,value.state])).digest('hex');
}
async function sign(config: SigningConfig, typ: string, subject: string, ttl: number,
  claims: Record<string, unknown>): Promise<string> {
  const now = Math.floor(Date.now()/1000);
  return new SignJWT(claims).setProtectedHeader({alg:'RS256',typ,kid:config.kid})
    .setIssuer(config.issuer).setAudience('roboeq-parent').setSubject(subject)
    .setJti(randomBytes(32).toString('base64url')).setIssuedAt(now).setExpirationTime(now+ttl)
    .sign(createPrivateKey(config.privateKey));
}
export function signIdentity(config: SigningConfig, request: MobileAuthorization,
  user: {id: string; name: string | null; email: string | null; phoneNumber: string | null}) {
  return sign(config,'roboeq-identity+jwt',user.id,60,{...request,request_hash:requestHash(request),
    display_name:user.name,email:user.email,phone:user.phoneNumber});
}
export function signStatus(config: SigningConfig, subject: string, nonce: string, active: boolean) {
  return sign(config,'roboeq-status+jwt',subject,30,{nonce,active});
}
