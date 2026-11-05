import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateKeyPairSync, createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { jwtVerify, importSPKI } from 'jose';
import { parseAuthorization, safeMobileReturnPath } from '../../src/lib/mobile/return-path';
import { signIdentity, signStatus, requestHash } from '../../src/lib/mobile/protocol';
import { loadMobileConfig } from '../../src/lib/mobile/config';

const params = () => new URLSearchParams({ response_type:'code',client_id:'roboeq-mobile',
  redirect_uri:'roboeq://auth/callback',code_challenge:'c'.repeat(43),
  code_challenge_method:'S256',state:'s'.repeat(32),scope:'parent:read parent:write' });
const keys=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},
  privateKeyEncoding:{type:'pkcs8',format:'pem'}});

test('login return preserves the complete validated native authorization request', () => {
  const path='/mobile/authorize?'+params();
  assert.equal(safeMobileReturnPath(path),path);
  assert.equal(parseAuthorization(params()).state,'s'.repeat(32));
});

test('login return rejects external redirects, smuggled parameters and weak state/PKCE', () => {
  for(const path of ['https://evil.test','//evil.test','/admin','/mobile/authorize?x=1',
    '/mobile/authorize?'+params()+'#fragment','/mobile/authorize?'+params()+'&state=duplicate']) {
    assert.equal(safeMobileReturnPath(path),null,path);
  }
  for(const [name,value] of [['redirect_uri','https://evil.test'],['client_id','other'],
    ['code_challenge_method','plain'],['state','short'],['code_challenge','x'],['scope','admin']]) {
    const p=params();p.set(name,value);assert.throws(()=>parseAuthorization(p));
  }
});

test('bridge stays disabled without complete explicit HTTPS/private-key configuration', () => {
  assert.equal(loadMobileConfig({}),null);
  assert.throws(()=>loadMobileConfig({MOBILE_BRIDGE_ENABLED:'true'}));
  const dir=mkdtempSync(join(tmpdir(),'roboeq-mobile-config-'));
  try {
    const file=join(dir,'key.pem');writeFileSync(file,keys.privateKey);
    const env={MOBILE_BRIDGE_ENABLED:'true',MOBILE_IDENTITY_ISSUER:'https://WEB.example.test:0443/',
      MOBILE_PARENT_ORIGIN:'https://parent.example.test',MOBILE_SIGNING_KEY_FILE:file,
      MOBILE_SIGNING_KID:'web-1',MOBILE_STATUS_TOKEN:'s'.repeat(43)};
    const config=loadMobileConfig(env)!;
    assert.equal(config.issuer,'https://web.example.test');
    assert.equal(config.parentOrigin,'https://parent.example.test');
    assert.throws(()=>loadMobileConfig({...env,MOBILE_PARENT_ORIGIN:'http://parent.example.test'}));
    assert.throws(()=>loadMobileConfig({...env,MOBILE_SIGNING_KID:'bad kid'}));
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('identity JWS carries only fresh User identity with the agreed hash and RSA type', async () => {
  const request=parseAuthorization(params());
  const config={issuer:'https://identity.example.test',kid:'web-1',privateKey:keys.privateKey};
  const token=await signIdentity(config,request,{id:'synthetic-user',name:null,email:null,phoneNumber:null});
  const key=await importSPKI(keys.publicKey,'RS256');
  const {payload,protectedHeader}=await jwtVerify(token,key,{issuer:config.issuer,audience:'roboeq-parent'});
  assert.deepEqual(protectedHeader,{alg:'RS256',typ:'roboeq-identity+jwt',kid:'web-1'});
  assert.equal(payload.sub,'synthetic-user');
  assert.equal(payload.exp!-payload.iat!,60);
  assert.equal(payload.display_name,null);
  const expected=createHash('sha256').update(JSON.stringify(['roboeq-mobile','roboeq://auth/callback',
    'c'.repeat(43),'S256','s'.repeat(32)])).digest('hex');
  assert.equal(payload.request_hash,expected);
  assert.equal(requestHash(request),expected);
  assert.equal(payload.role,undefined);
});

test('status assertion binds the exact subject and nonce and cannot act as an identity grant', async () => {
  const token=await signStatus({issuer:'https://identity.example.test',kid:'web-1',privateKey:keys.privateKey},
    'synthetic-user','n'.repeat(43),false);
  const {payload,protectedHeader}=await jwtVerify(token,await importSPKI(keys.publicKey,'RS256'),
    {issuer:'https://identity.example.test',audience:'roboeq-parent'});
  assert.equal(protectedHeader.typ,'roboeq-status+jwt');
  assert.equal(payload.active,false);assert.equal(payload.sub,'synthetic-user');
  assert.equal(payload.nonce,'n'.repeat(43));assert.equal(payload.exp!-payload.iat!,30);
  assert.equal(payload.request_hash,undefined);
});
