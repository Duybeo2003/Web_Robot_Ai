export const metadata = {
  title: "Chính sách vận chuyển - RoboEd",
  description: "Thông tin về chính sách giao hàng và vận chuyển.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl bg-white my-8 rounded-sm shadow-sm border border-neutral-100">
      <h1 className="text-3xl font-bold mb-8 text-[#FF5722] font-heading uppercase text-center border-b pb-4">
        Chính sách vận chuyển
      </h1>
      <div className="prose prose-neutral max-w-none space-y-6 text-neutral-700 leading-relaxed">
        <h3 className="text-xl font-bold text-foreground mt-6">1. Phí giao hàng</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Miễn phí vận chuyển (Freeship):</strong> Áp dụng cho mọi đơn hàng có tổng giá trị từ 500.000 VNĐ trở lên trên toàn quốc.</li>
          <li><strong>Đơn hàng dưới 500.000 VNĐ:</strong> Phí giao hàng sẽ được tính theo bảng giá niêm yết của đơn vị vận chuyển (Giao Hàng Nhanh, Viettel Post, GHTK), phí trung bình khoảng 25.000 - 35.000 VNĐ tùy khu vực.</li>
        </ul>

        <h3 className="text-xl font-bold text-foreground mt-6">2. Thời gian giao hàng</h3>
        <p>Sau khi xác nhận đơn hàng thành công, chúng tôi sẽ tiến hành đóng gói và bàn giao cho đơn vị vận chuyển. Thời gian giao hàng dự kiến:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Khu vực Bắc Ninh / Hà Nội:</strong> Nhận hàng trong vòng 1-2 ngày làm việc. Có hỗ trợ giao hỏa tốc trong ngày.</li>
          <li><strong>Các tỉnh thành khác:</strong> Nhận hàng trong khoảng 3-5 ngày làm việc tùy thuộc vào khoảng cách địa lý.</li>
        </ul>
        <p className="text-sm italic text-neutral-500">Lưu ý: Thời gian giao hàng có thể kéo dài hơn dự kiến do điều kiện thời tiết, dịch bệnh hoặc vào các dịp lễ tết.</p>

        <h3 className="text-xl font-bold text-foreground mt-6">3. Kiểm tra hàng khi nhận</h3>
        <p>Quý khách hoàn toàn được phép <strong>đồng kiểm</strong> (mở gói hàng và kiểm tra ngoại quan sản phẩm) trước khi thanh toán cho nhân viên giao hàng.</p>
        <p>Trường hợp sản phẩm bị móp méo, hư hỏng vật lý hoặc không đúng mẫu mã đã đặt, quý khách vui lòng từ chối nhận hàng và liên hệ ngay với Hotline 0385.333.111 để được hỗ trợ.</p>
      </div>
    </div>
  );
}
