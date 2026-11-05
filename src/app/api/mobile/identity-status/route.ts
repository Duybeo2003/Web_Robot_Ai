import { timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { readJsonBody, RequestBodyError } from '@/lib/read-json-body';
import { loadMobileConfig } from '@/lib/mobile/config';
import { signStatus } from '@/lib/mobile/protocol';
export const runtime = 'nodejs';
const headers={'Cache-Control':'no-store','Pragma':'no-cache'};
export async function POST(request: Request) {
  try {
    const config=loadMobileConfig();
    if (!config) return Response.json({error:'Unavailable'},{status:503,headers});
    const actual=Buffer.from(request.headers.get('authorization') ?? '');
    const expected=Buffer.from('Bearer '+config.statusToken);
    if (actual.length!==expected.length || !timingSafeEqual(actual,expected)) {
      return Response.json({error:'Unauthorized'},{status:401,headers});
    }
    const value=await readJsonBody(request,2048);
    if (!value || typeof value!=='object' || Array.isArray(value) || Object.keys(value).length!==2 ||
      !('subject' in value) || !('nonce' in value) || typeof value.subject!=='string' ||
      value.subject.length<1 || value.subject.length>255 || value.subject.trim()!==value.subject ||
      /[\u0000-\u001f\u007f\ud800-\udfff]/.test(value.subject) ||
      typeof value.nonce!=='string' || !/^[A-Za-z0-9_-]{43}$/.test(value.nonce)) {
      return Response.json({error:'Invalid request'},{status:400,headers});
    }
    const user=await prisma.user.findFirst({where:{id:value.subject,deletedAt:null},select:{id:true}});
    const assertion=await signStatus(config,value.subject,value.nonce,!!user);
    return Response.json({assertion},{headers});
  } catch(error) {
    return Response.json({error:'Unavailable'},{status:error instanceof RequestBodyError?error.status:503,headers});
  }
}
