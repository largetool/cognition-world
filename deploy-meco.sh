#!/bin/bash
set -e

cd /Users/abc/Desktop/Personal/认知界/日志/2026-05-08

echo "=== 1. 备份当前版本 ==="
cp -r cognition-world cognition-world-backup-$(date +%Y%m%d-%H%M%S)
echo "备份完成 → cognition-world-backup-... 目录"

echo "=== 2. 覆盖 MEEO 代码 ==="
cp -r meoo_zip_1780497442533/* cognition-world/
echo "覆盖完成"

echo "=== 3. 恢复 Supabase 配置（不能被覆盖） ==="
cp cognition-world-backup-*/src/supabase/client.ts cognition-world/src/supabase/client.ts
echo "Supabase 配置已恢复"

echo "=== 4. 写 images.d.ts ==="
cat > cognition-world/src/images.d.ts << 'EOF'
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  const src: string;
  export default src;
}
EOF
echo "images.d.ts 已创建"

echo "=== 5. 推送到 GitHub ==="
cd cognition-world
git add .
git commit -m "MEEO: UserPage 改造 + LoginPage 背景修复"
git push

echo "=== 全部完成 ==="
