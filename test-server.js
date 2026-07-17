const http = require('http');

const pagesToTest = [
  '/',
  '/shop',
  '/shop?type=ROBOT_STEM',
  '/shop?q=arduino',
  '/checkout',
  '/admin/products',
  '/admin/orders',
  '/profile',
];

async function runTests() {
  console.log("Bắt đầu kiểm thử tự động các trang (Smoke Test)...\\n");
  let passed = 0;
  
  for (const page of pagesToTest) {
    await new Promise((resolve) => {
      const req = http.get(`http://localhost:3000${page}`, (res) => {
        if (res.statusCode === 200 || res.statusCode === 307 || res.statusCode === 302) {
          console.log(`✅ [PASS] ${page} - Status: ${res.statusCode}`);
          passed++;
        } else {
          console.log(`❌ [FAIL] ${page} - Status: ${res.statusCode}`);
        }
        res.resume(); // consume response data to free up memory
        resolve();
      }).on('error', (e) => {
        console.log(`❌ [FAIL] ${page} - Error: ${e.message}`);
        resolve();
      });
    });
  }

  console.log(`\\nHoàn thành: ${passed}/${pagesToTest.length} trang hoạt động tốt.`);
}

runTests();
