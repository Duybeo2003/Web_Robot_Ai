import { NextResponse } from 'next/server';
import { createVnPayUrl } from '@/lib/vnpay';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: 'Thiếu mã đơn hàng' }, { status: 400 });
  }

  // SECURITY: Fetch amount from database, NOT from client
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { totalAmount: true, userId: true, paymentStatus: true }
  });

  if (!order) {
    return NextResponse.json({ error: 'Đơn hàng không tồn tại' }, { status: 404 });
  }

  // Verify ownership
  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Prevent double payment
  if (order.paymentStatus === 'PAID') {
    return NextResponse.json({ error: 'Đơn hàng đã được thanh toán' }, { status: 400 });
  }

  const amount = Number(order.totalAmount);
  const ipAddr = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  const vnpayUrl = createVnPayUrl(orderId, amount, ipAddr);

  return NextResponse.redirect(vnpayUrl);
}
