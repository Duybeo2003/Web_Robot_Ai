export const metadata = {
  title: "Chính sách đổi trả - RoboEd",
  description: "Điều kiện và quy trình đổi trả hàng hóa.",
};

export default function ReturnPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl bg-white my-8 rounded-sm shadow-sm border border-neutral-100">
      <h1 className="text-3xl font-bold mb-8 text-[#FF5722] font-heading uppercase text-center border-b pb-4">
        Chính sách đổi trả (RMA)
      </h1>
      <div className="prose prose-neutral max-w-none space-y-6 text-neutral-700 leading-relaxed">
        <p>RoboEd cam kết bán hàng chính hãng và chất lượng. Tuy nhiên, nếu quý khách gặp sự cố với sản phẩm, chúng tôi có chính sách đổi trả minh bạch để bảo vệ quyền lợi của bạn.</p>

        <h3 className="text-xl font-bold text-foreground mt-6">1. Điều kiện đổi trả</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Thời gian: Trong vòng <strong>07 ngày</strong> kể từ ngày nhận hàng thành công.</li>
          <li>Sản phẩm gặp lỗi kỹ thuật từ nhà sản xuất (không lên nguồn, mạch lỗi, linh kiện thiếu...).</li>
          <li>Sản phẩm gửi sai mẫu mã, sai cấu hình so với đơn đặt hàng.</li>
          <li>Sản phẩm phải còn nguyên vẹn, không có dấu hiệu va đập, rơi vỡ, cháy nổ do sử dụng sai nguồn điện, hoặc bị vô nước.</li>
          <li>Còn đầy đủ hộp, phụ kiện đi kèm và tem bảo hành (nếu có).</li>
        </ul>

        <h3 className="text-xl font-bold text-foreground mt-6">2. Các trường hợp KHÔNG hỗ trợ đổi trả</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Sản phẩm hỏng do lỗi chủ quan của người dùng (cắm sai cực gây chập cháy, làm rơi vỡ...).</li>
          <li>Quá thời hạn 07 ngày kể từ ngày nhận hàng (sẽ chuyển sang chính sách bảo hành).</li>
          <li>Khách hàng thay đổi ý định và không còn nhu cầu sử dụng (không do lỗi sản phẩm).</li>
        </ul>

        <h3 className="text-xl font-bold text-foreground mt-6">3. Quy trình thực hiện</h3>
        <p>Nếu sản phẩm đủ điều kiện, vui lòng thực hiện theo các bước sau:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Liên hệ Hotline/Zalo <strong>0385.333.111</strong> và cung cấp Video/Hình ảnh thể hiện rõ lỗi của sản phẩm.</li>
          <li>Gửi sản phẩm về địa chỉ bảo hành của chúng tôi (sẽ được nhân viên cung cấp).</li>
          <li>Sau khi kỹ thuật viên kiểm tra xác nhận lỗi (1-2 ngày), RoboEd sẽ gửi sản phẩm thay thế mới 100% đến quý khách. Miễn phí 100% phí vận chuyển 2 chiều.</li>
        </ol>
      </div>
    </div>
  );
}
