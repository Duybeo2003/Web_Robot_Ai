import { NextResponse } from 'next/server';
import { createVnPayUrl } from '@/lib/vnpay';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  const amountStr = searchParams.get('amount');

  if (!orderId || !amountStr) {
    return NextResponse.json({ error: 'Thiếu thông tin đơn hàng' }, { status: 400 });
  }

  const amount = parseFloat(amountStr);
  
  // Forwarded headers for IP might be needed in real prod env
  const ipAddr = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  const vnpayUrl = createVnPayUrl(orderId, amount, ipAddr);

  return NextResponse.redirect(vnpayUrl);
}
