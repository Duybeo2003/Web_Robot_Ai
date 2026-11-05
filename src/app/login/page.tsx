import { redirect } from 'next/navigation';
import { safeMobileReturnPath } from '@/lib/mobile/return-path';
export default async function LoginPage({searchParams}: {
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const target=safeMobileReturnPath((await searchParams).callbackUrl);
  const query=new URLSearchParams({login:'true'});
  if(target)query.set('callbackUrl',target);
  redirect('/?'+query);
}
