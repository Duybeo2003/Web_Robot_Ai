import os
import re

files_to_fix = {
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
}

for filepath, vars_to_remove in files_to_fix.items():
    full_path = os.path.join("U:/Web_Robot_Ai", filepath)
    if not os.path.exists(full_path):
        continue
    
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    for var in vars_to_remove:
        # Regex to remove import var if it's the only one: import { Var } from ...
        content = re.sub(rf'import\s+{{\s*{var}\s*}}\s+from\s+[^;]+;\n?', '', content)
        # Regex to remove import var if it's in a list: import { A, Var, B } from ...
        content = re.sub(rf',\s*{var}\b', '', content)
        content = re.sub(rf'\b{var}\s*,', '', content)
        # Regex to remove default import: import Var from ...
        content = re.sub(rf'import\s+{var}\s+from\s+[^;]+;\n?', '', content)
        
        # for catch (err) -> catch
        if var == 'err' or var == 'error':
            content = re.sub(rf'catch\s*\(\s*{var}\s*\)', 'catch', content)
            
        # for assigned but never used const var = ...
        if var in ['router', 'session', 'theme', 'adminId', 'skill']:
            content = re.sub(rf'(const|let|var)\s+{var}\s*=\s*[^;]+;', '', content)
            # if inside destructuring: const { a, router } =
            content = re.sub(rf',\s*{var}\b', '', content)
            content = re.sub(rf'\b{var}\s*,', '', content)
            
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Fixed unused vars")
