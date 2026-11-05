import { AuthorizationError, requireUser } from '@/lib/authz';
import { loadMobileConfig } from '@/lib/mobile/config';
import { parseAuthorization } from '@/lib/mobile/return-path';
import { signIdentity } from '@/lib/mobile/protocol';
export const runtime = 'nodejs';
const headers={'Cache-Control':'no-store','Pragma':'no-cache','Referrer-Policy':'no-referrer'};
export async function GET(request: Request) {
  try {
    const config=loadMobileConfig();
    if (!config) return Response.json({error:'Mobile sign-in is unavailable'},{status:503,headers});
    const url=new URL(request.url);
    if (url.search.length>2048) return Response.json({error:'Invalid authorization'},{status:400,headers});
    let authRequest;
    try { authRequest=parseAuthorization(url.searchParams); }
    catch { return Response.json({error:'Invalid authorization'},{status:400,headers}); }
    let user;
    try { user=await requireUser(); }
    catch(error) {
      if (!(error instanceof AuthorizationError)) throw error;
      const target=new URL('/login',config.issuer);
      target.searchParams.set('callbackUrl',url.pathname+url.search);
      return new Response(null,{status:303,headers:{...headers,Location:target.toString()}});
    }
    const assertion=await signIdentity(config,authRequest,user);
    const response=await fetch(config.parentOrigin+'/api/parent/v1/internal/authorize',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assertion}),
      redirect:'error',cache:'no-store',signal:AbortSignal.timeout(5000)});
    if (!response.ok) throw new Error();
    // The fixed first-party server must return a bounded opaque code, never tokens.
    const reader=response.body?.getReader();
    if (!reader) throw new Error();
    let raw=''; const decoder=new TextDecoder();
    while(true){const {done,value}=await reader.read();if(done)break;
      raw+=decoder.decode(value,{stream:true});if(raw.length>2048){await reader.cancel();throw new Error();}}
    const body: unknown=JSON.parse(raw);
    if (!body || typeof body!=='object' || !('code' in body) ||
      typeof body.code!=='string' || !/^[A-Za-z0-9_-]{43}$/.test(body.code)) throw new Error();
    const callback=new URL(authRequest.redirect_uri);
    callback.searchParams.set('code',body.code);callback.searchParams.set('state',authRequest.state);
    return new Response(null,{status:303,headers:{...headers,Location:callback.toString()}});
  } catch { return Response.json({error:'Mobile sign-in is unavailable'},{status:503,headers}); }
}
