"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, XCircle, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function MockVnpayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const amount = searchParams.get("vnp_Amount");
  const orderInfo = searchParams.get("vnp_OrderInfo");
  const txnRef = searchParams.get("vnp_TxnRef");
  const returnUrl = searchParams.get("vnp_ReturnUrl");

  const handlePaymentSuccess = () => {
    if (!returnUrl) return;
    
    // Construct a mock return URL with success response code (00)
    const url = new URL(returnUrl);
    // Copy all original search params
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    
    // Add success codes
    url.searchParams.set("vnp_ResponseCode", "00");
    url.searchParams.set("vnp_TransactionStatus", "00");
    
    // Note: In a real environment, the secure hash would need to be re-calculated 
    // by the server, but since this is a mock flow, we will just pass it as is 
    // and modify our backend to accept mock responses.
    url.searchParams.set("mock_status", "success");
    
    window.location.href = url.toString();
  };

  const handlePaymentFailed = () => {
    if (!returnUrl) return;
    
    const url = new URL(returnUrl);
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    
    // Error code 24: Customer cancelled the transaction
    url.searchParams.set("vnp_ResponseCode", "24");
    url.searchParams.set("vnp_TransactionStatus", "24");
    url.searchParams.set("mock_status", "failed");
    
    window.location.href = url.toString();
  };

  const formattedAmount = amount 
    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount) / 100)
    : "0 ₫";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <ShieldCheck className="w-24 h-24" />
          </div>
          <h1 className="text-2xl font-black tracking-wider relative z-10">VNPAY SANDBOX</h1>
          <p className="text-blue-100 mt-1 text-sm font-medium relative z-10">Môi trường thử nghiệm giả lập (Mock)</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          
          <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Xác nhận thanh toán</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Mã đơn hàng</span>
              <span className="font-bold text-gray-900">{txnRef || "N/A"}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Nội dung</span>
              <span className="text-gray-900 font-medium text-right max-w-[60%] truncate">
                {orderInfo || "N/A"}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Số tiền thanh toán</span>
              <span className="font-black text-2xl text-blue-600">{formattedAmount}</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-xs text-yellow-800 text-center leading-relaxed">
              <strong>Lưu ý:</strong> Đây là trang thanh toán giả lập được tạo ra bởi AI vì bạn chưa cấu hình thông tin VNPAY thật. Bạn có thể chọn Thanh toán thành công hoặc Hủy để test luồng.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handlePaymentSuccess}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Xác nhận Thanh toán
            </Button>
            
            <Button 
              onClick={handlePaymentFailed}
              variant="outline"
              className="w-full h-14 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-all"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Hủy thanh toán
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MockVnpayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <MockVnpayContent />
    </Suspense>
  );
}
