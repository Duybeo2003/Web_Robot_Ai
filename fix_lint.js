const fs = require('fs');
const path = require('path');

const filesToFix = {
    "src/app/huong-dan/page.tsx": ["Link"],
    "src/app/mock-vnpay/page.tsx": ["router"],
    "src/app/shop/[slug]/components/promotional-banner.tsx": ["Timer"],
    "src/app/shop/loading.tsx": ["Loader2"],
    "src/components/admin/app-sidebar.tsx": ["Tags"],
    "src/components/auth-modal.tsx": ["err"],
    "src/components/cart-sheet.tsx": ["SheetFooter", "Separator"],
    "src/components/cart-syncer.tsx": ["session"],
    "src/components/providers.tsx": ["NextThemesProvider"],
    "src/components/ui/ai-chatbot.tsx": ["Button", "error"],
    "src/components/ui/gift-recommender.tsx": ["ArrowRight", "skill"],
    "src/components/ui/wishlist-button.tsx": ["theme"],
    "src/types/next-auth.d.ts": ["JWT"],
};

for (const [filepath, varsToRemove] of Object.entries(filesToFix)) {
    const fullPath = path.join("U:/Web_Robot_Ai", filepath);
    if (!fs.existsSync(fullPath)) continue;
    
    let content = fs.readFileSync(fullPath, "utf-8");
    
    for (const v of varsToRemove) {
        content = content.replace(new RegExp(`import\\s+\\{\\s*${v}\\s*\\}\\s+from\\s+[^;]+;\\n?`, 'g'), '');
        content = content.replace(new RegExp(`,\\s*${v}\\b`, 'g'), '');
        content = content.replace(new RegExp(`\\b${v}\\s*,`, 'g'), '');
        content = content.replace(new RegExp(`import\\s+${v}\\s+from\\s+[^;]+;\\n?`, 'g'), '');
        
        if (v === 'err' || v === 'error') {
            content = content.replace(new RegExp(`catch\\s*\\(\\s*${v}\\s*\\)`, 'g'), 'catch');
        }
        
        if (['router', 'session', 'theme', 'adminId', 'skill'].includes(v)) {
            content = content.replace(new RegExp(`(const|let|var)\\s+${v}\\s*=\\s*[^;]+;`, 'g'), '');
        }
    }
    
    fs.writeFileSync(fullPath, content, "utf-8");
}
console.log("Fixed unused vars");
