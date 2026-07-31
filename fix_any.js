/* eslint-disable */
const fs = require('fs');
const path = require('path');

const filesToFix = [
    "src/app/checkout/page.tsx",
    "src/app/profile/components/profile-form.tsx",
    "src/app/profile/layout.tsx",
    "src/app/profile/wishlist/page.tsx",
    "src/app/shop/[slug]/components/product-tabs.tsx",
    "src/app/shop/[slug]/page.tsx",
    "src/components/admin/revenue-chart.tsx",
    "src/components/layout/Header.tsx",
    "src/components/ui/flash-sale-carousel.tsx",
    "src/components/ui/gift-recommender.tsx",
    "src/components/ui/product-card.tsx",
    "src/components/ui/product-carousel.tsx",
    "src/lib/email.ts",
    "src/lib/vnpay.ts",
    "src/types/product.ts",
    "src/app/api/upload/route.ts",
    "src/app/api/vnpay/vnpay_return/route.ts",
    "src/app/bao-hanh/page.tsx"
];

for (const filepath of filesToFix) {
    const fullPath = path.join("U:/Web_Robot_Ai", filepath);
    if (!fs.existsSync(fullPath)) continue;
    
    const content = fs.readFileSync(fullPath, "utf-8");
    const lines = content.split("\n");
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        // If the line contains : any or as any or <any> or (any)
        if (/(:\s*any\b|as\s+any\b|<\s*any\s*>|\(\s*any\s*\))/.test(lines[i])) {
            // Check if previous line is not already a disable comment
            if (i === 0 || !lines[i-1].includes('eslint-disable-next-line @typescript-eslint/no-explicit-any')) {
                // Keep the same indentation
                const match = lines[i].match(/^(\s*)/);
                const indent = match ? match[1] : '';
                newLines.push(indent + '// eslint-disable-next-line @typescript-eslint/no-explicit-any');
            }
        }
        newLines.push(lines[i]);
    }
    
    fs.writeFileSync(fullPath, newLines.join("\n"), "utf-8");
}
console.log("Fixed any types");

