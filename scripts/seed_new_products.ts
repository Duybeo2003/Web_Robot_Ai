import { PrismaClient, Prisma, ProductType } from "@prisma/client";

const prisma = new PrismaClient();

const newProducts: Prisma.ProductCreateInput[] = [
  // ================= ROBOT STEM =================
  {
    title: "Robot Alpha Mini - Lập trình AI thông minh",
    slug: "robot-alpha-mini-ai",
    price: 3590000,
    description: "Robot hình người mini có khả năng giao tiếp, nhận diện khuôn mặt và lập trình bằng Scratch/Python. Phù hợp cho bé từ 8 tuổi khám phá AI và Robotics.",
    imageUrl: "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?q=80&w=800&auto=format&fit=crop",
    type: "ROBOT_STEM",
    inventoryCount: 20,
  },
  {
    title: "Robot Chó Thông Minh - Robot Dog X1",
    slug: "robot-cho-thong-minh-x1",
    price: 4290000,
    description: "Robot chó sinh học bionic, mô phỏng chuyển động thực tế. Cho phép lập trình quỹ đạo di chuyển, tránh vật cản tự động, đồng hành cùng bé mọi lúc.",
    imageUrl: "https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=800&auto=format&fit=crop",
    type: "ROBOT_STEM",
    inventoryCount: 15,
  },
  {
    title: "Bộ Lắp Ráp Robot Nhện 6 Chân Hexapod",
    slug: "robot-nhen-hexapod",
    price: 1250000,
    description: "Kit robot nhện DIY cho bé tự tay lắp ráp và lập trình. Giúp hiểu về cơ cấu truyền động cơ khí và nguyên lý động lực học.",
    imageUrl: "https://images.unsplash.com/photo-1616161560417-66d4da58506b?q=80&w=800&auto=format&fit=crop",
    type: "ROBOT_STEM",
    inventoryCount: 30,
  },
  {
    title: "Robot Dò Đường Line Follower",
    slug: "robot-do-duong",
    price: 890000,
    description: "Robot tự động dò đường theo vạch đen. Trang bị cảm biến hồng ngoại nhạy bén, bé có thể vẽ đường đi bất kỳ cho robot chạy theo.",
    imageUrl: "https://images.unsplash.com/photo-1601662528567-526cd06f3584?q=80&w=800&auto=format&fit=crop",
    type: "ROBOT_STEM",
    inventoryCount: 50,
  },
  {
    title: "Robot Vẽ Tranh Tự Động DrawBot",
    slug: "robot-ve-tranh-drawbot",
    price: 1150000,
    description: "Robot thiết kế thông minh với cánh tay kẹp bút. Lập trình dễ dàng để robot tự động vẽ ra các bức tranh tuyệt đẹp từ mã code của bé.",
    imageUrl: "https://plus.unsplash.com/premium_photo-1663089688180-444ffc05f03a?q=80&w=800&auto=format&fit=crop",
    type: "ROBOT_STEM",
    inventoryCount: 25,
  },
  {
    title: "Xe Tank Robot Chiến Đấu Bắn Bi Nước",
    slug: "xe-tank-robot-ban-bi",
    price: 2190000,
    description: "Xe tank điều khiển đa hướng Mecanum. Tích hợp camera truyền hình ảnh trực tiếp và tháp pháo bắn bi nước an toàn. Giải trí và học tập đỉnh cao.",
    imageUrl: "https://images.unsplash.com/photo-1596484552834-6a58f850b0a1?q=80&w=800&auto=format&fit=crop",
    type: "ROBOT_STEM",
    inventoryCount: 10,
  },

  // ================= KIT ARDUINO =================
  {
    title: "Bộ Kit Tự Học Arduino UNO R3 Cơ Bản",
    slug: "kit-arduino-uno-co-ban",
    price: 450000,
    description: "Bộ kit nhập môn hoàn hảo cho người mới bắt đầu. Gồm mạch UNO R3, breadboard, LED, điện trở, cảm biến ánh sáng và sách hướng dẫn chi tiết.",
    imageUrl: "https://images.unsplash.com/photo-1605206259929-87c2b535d564?q=80&w=800&auto=format&fit=crop",
    type: "KIT_ARDUINO",
    inventoryCount: 100,
  },
  {
    title: "Bộ Kit Smart Home IoT với Arduino",
    slug: "kit-smart-home-iot",
    price: 1850000,
    description: "Học cách xây dựng nhà thông minh: điều khiển đèn bằng giọng nói, báo động chống trộm, cảnh báo rò rỉ khí gas qua điện thoại.",
    imageUrl: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?q=80&w=800&auto=format&fit=crop",
    type: "KIT_ARDUINO",
    inventoryCount: 40,
  },
  {
    title: "Mô Hình Trồng Cây Tự Động Tưới Nước",
    slug: "mo-hinh-tuoi-cay-tu-dong",
    price: 650000,
    description: "Ứng dụng Arduino vào nông nghiệp. Cảm biến độ ẩm đất tự động kích hoạt máy bơm khi cây thiếu nước. Món quà xanh tuyệt vời cho bé.",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
    type: "KIT_ARDUINO",
    inventoryCount: 60,
  },
  {
    title: "Mạch Arduino Mega 2560 Pro Chuyên Sâu",
    slug: "arduino-mega-2560-pro",
    price: 590000,
    description: "Bo mạch mở rộng với vô số chân cắm, bộ nhớ lớn hơn. Phù hợp cho các dự án lớn như máy in 3D, hệ thống tự động hóa công nghiệp.",
    imageUrl: "https://images.unsplash.com/photo-1610667357064-18451c86db25?q=80&w=800&auto=format&fit=crop",
    type: "KIT_ARDUINO",
    inventoryCount: 50,
  },
  {
    title: "Bộ Cảm Biến Arduino Nâng Cao 37 In 1",
    slug: "bo-cam-bien-37-in-1",
    price: 790000,
    description: "Tuyển tập 37 module cảm biến thông dụng nhất: nhiệt độ, âm thanh, laser, siêu âm... Thỏa sức sáng tạo mọi dự án với Arduino.",
    imageUrl: "https://images.unsplash.com/photo-1592503254549-cd546d4960d5?q=80&w=800&auto=format&fit=crop",
    type: "KIT_ARDUINO",
    inventoryCount: 70,
  },
  {
    title: "Tay Cầm Cánh Tay Robot 4 Trục",
    slug: "canh-tay-robot-4-truc",
    price: 1550000,
    description: "Cánh tay robot mini điều khiển bằng chiết áp hoặc lập trình tự động. Mô phỏng cánh tay phân xưởng lắp ráp công nghiệp.",
    imageUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800&auto=format&fit=crop",
    type: "KIT_ARDUINO",
    inventoryCount: 20,
  },

  // ================= DO_CHOI_LOGIC =================
  {
    title: "Bộ Đồ Chơi Lắp Ráp Gỗ Chuyển Động Gear",
    slug: "lap-rap-go-chuyen-dong",
    price: 490000,
    description: "Khám phá nguyên lý bánh răng cơ học. Các chi tiết bằng gỗ mộc mạc an toàn, khi quay tay cầm tạo ra hiệu ứng chuyển động liên hoàn đẹp mắt.",
    imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=800&auto=format&fit=crop",
    type: "DO_CHOI_LOGIC",
    inventoryCount: 120,
  },
  {
    title: "Bảng Mạch Điện Tử Nối Dây An Toàn",
    slug: "bang-mach-dien-tu-an-toan",
    price: 350000,
    description: "Đồ chơi thực hành mạch điện với pin 3V an toàn tuyệt đối. Bé học cách nối công tắc, làm đèn sáng, làm quay cánh quạt.",
    imageUrl: "https://images.unsplash.com/photo-1522067807212-0731477759b0?q=80&w=800&auto=format&fit=crop",
    type: "DO_CHOI_LOGIC",
    inventoryCount: 150,
  },
  {
    title: "Cờ Tướng AI Thông Minh",
    slug: "co-tuong-ai-thong-minh",
    price: 1290000,
    description: "Bàn cờ tướng tích hợp màn hình cảm ứng và AI. Bạn có thể chơi với máy ở nhiều cấp độ, hoặc chơi qua mạng với bạn bè toàn cầu.",
    imageUrl: "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?q=80&w=800&auto=format&fit=crop",
    type: "DO_CHOI_LOGIC",
    inventoryCount: 45,
  },
  {
    title: "Khối Rubik 3x3 Thông Minh Bluetooth",
    slug: "rubik-thong-minh-bluetooth",
    price: 890000,
    description: "Khối rubik kết nối điện thoại qua app, theo dõi từng bước xoay của bạn theo thời gian thực và hướng dẫn cách giải chỉ trong 30 giây.",
    imageUrl: "https://images.unsplash.com/photo-1591991731833-b4807cf7ef94?q=80&w=800&auto=format&fit=crop",
    type: "DO_CHOI_LOGIC",
    inventoryCount: 80,
  },
  {
    title: "Bộ Puzzle Mô Hình Địa Cầu Gỗ 3D",
    slug: "puzzle-dia-cau-go-3d",
    price: 650000,
    description: "Xếp hình quả địa cầu 3D với 180 mảnh ghép. Không cần keo dán. Rèn luyện tính kiên nhẫn và khả năng tư duy không gian cho trẻ.",
    imageUrl: "https://images.unsplash.com/photo-1558522195-e120110d529b?q=80&w=800&auto=format&fit=crop",
    type: "DO_CHOI_LOGIC",
    inventoryCount: 55,
  },
  {
    title: "Thang Máy Bằng Gỗ Tự Động STEM",
    slug: "thang-may-go-stem",
    price: 250000,
    description: "Mô hình thang máy vật lý. Bé sẽ học cách sử dụng ròng rọc, động cơ điện nhỏ để nâng hạ cabin thang máy vô cùng thú vị.",
    imageUrl: "https://images.unsplash.com/photo-1618580004079-05574c86bb0b?q=80&w=800&auto=format&fit=crop",
    type: "DO_CHOI_LOGIC",
    inventoryCount: 90,
  }
];

async function main() {
  console.log("Xóa toàn bộ sản phẩm cũ để làm mới...");
  await prisma.product.deleteMany({});
  console.log("Đã xóa sản phẩm cũ.");

  console.log("Bắt đầu thêm 18 sản phẩm mới...");
  for (const prod of newProducts) {
    const created = await prisma.product.create({
      data: prod,
    });
    console.log(`Đã thêm: ${created.title}`);
  }
  console.log("Hoàn tất!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
