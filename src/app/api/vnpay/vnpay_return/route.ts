import { NextResponse } from 'next/server';
import { verifyVnPayReturn } from '@/lib/vnpay';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  let vnp_Params: any = {};
  searchParams.forEach((value, key) => {
    vnp_Params[key] = value;
  });

  const secureHash = vnp_Params['vnp_SecureHash'];
  if (!secureHash) {
    return NextResponse.redirect(new URL('/checkout/error?msg=Thiếu chữ ký bảo mật', req.url));
  }

  const isValid = verifyVnPayReturn(vnp_Params);
  const orderId = vnp_Params['vnp_TxnRef'];
  const responseCode = vnp_Params['vnp_ResponseCode'];

  if (isValid) {
    if (responseCode === '00') {
      // Payment success
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING'
          }
        });
        
        revalidatePath('/profile/orders');
        revalidatePath('/admin/orders');

        return NextResponse.redirect(new URL(`/checkout/success/${orderId}`, req.url));
      } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.redirect(new URL(`/checkout/error?msg=Lỗi cập nhật đơn hàng`, req.url));
      }
    } else {
      // Payment failed
      return NextResponse.redirect(new URL(`/checkout/error?msg=Thanh toán thất bại hoặc bị hủy (Mã: ${responseCode})`, req.url));
    }
  } else {
    return NextResponse.redirect(new URL('/checkout/error?msg=Sai chữ ký bảo mật', req.url));
  }
}
