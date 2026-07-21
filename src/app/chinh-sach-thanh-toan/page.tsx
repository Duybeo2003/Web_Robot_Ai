export const metadata = {
  title: "Chính sách thanh toán - RoboEd",
  description: "Các hình thức thanh toán được chấp nhận tại RoboEd.",
};

export default function PaymentPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl bg-white my-8 rounded-sm shadow-sm border border-neutral-100">
      <h1 className="text-3xl font-bold mb-8 text-[#FF5722] font-heading uppercase text-center border-b pb-4">
        Chính sách thanh toán
      </h1>
      <div className="prose prose-neutral max-w-none space-y-6 text-neutral-700 leading-relaxed">
        <p>Để mang đến trải nghiệm mua sắm tiện lợi và an toàn nhất, RoboEd hỗ trợ đa dạng các hình thức thanh toán sau:</p>
        
        <h3 className="text-xl font-bold text-foreground mt-6">1. Thanh toán tiền mặt khi nhận hàng (COD)</h3>
        <p>Quý khách có thể lựa chọn hình thức thanh toán khi nhận hàng (COD - Cash On Delivery). Áp dụng cho mọi đơn hàng trên toàn quốc.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Quý khách thanh toán trực tiếp cho nhân viên giao hàng khi nhận và kiểm tra sản phẩm.</li>
          <li>Chỉ chấp nhận thanh toán bằng tiền mặt VNĐ.</li>
        </ul>

        <h3 className="text-xl font-bold text-foreground mt-6">2. Thanh toán chuyển khoản ngân hàng / VietQR</h3>
        <p>Quý khách có thể chuyển khoản trực tiếp qua tài khoản ngân hàng của RoboEd thông qua mã VietQR hoặc số tài khoản thủ công.</p>
        <div className="bg-neutral-50 p-4 rounded-sm border border-neutral-200 mt-2">
          <p><strong>Ngân hàng:</strong> Vietcombank (VCB)</p>
          <p><strong>Chủ tài khoản:</strong> NGUYEN QUOC DUY</p>
          <p><strong>Số tài khoản:</strong> 1058744697</p>
          <p><strong>Nội dung:</strong> ROBOED [MÃ ĐƠN HÀNG]</p>
        </div>
        <p className="text-sm italic mt-2 text-neutral-500">Lưu ý: Đơn hàng sẽ được xử lý ngay sau khi chúng tôi xác nhận đã nhận được tiền trong tài khoản.</p>

        <h3 className="text-xl font-bold text-foreground mt-6">3. Thanh toán qua ví điện tử VNPay</h3>
        <p>Chúng tôi đã tích hợp cổng thanh toán VNPay, cho phép quý khách thanh toán an toàn, nhanh chóng thông qua:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Ứng dụng Mobile Banking của các ngân hàng.</li>
          <li>Thẻ ATM nội địa (Có đăng ký Internet Banking).</li>
          <li>Thẻ tín dụng quốc tế Visa/MasterCard.</li>
        </ul>
      </div>
    </div>
  );
}
