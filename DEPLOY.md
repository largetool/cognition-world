# 认知界 Cognition World - 部署指南

## 一、Vercel 部署步骤

### 1. 准备代码
```bash
# 确保已安装依赖
pnpm install

# 本地构建测试
pnpm run build
```

### 2. 创建 Vercel 项目
1. 登录 [Vercel](https://vercel.com)
2. 点击 "Add New Project"
3. 导入 GitHub 仓库或上传代码
4. 选择项目根目录 `/home/project`

### 3. 配置环境变量
在 Vercel 项目设置中，添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | Supabase 匿名公钥 |

### 4. 构建设置
Vercel 会自动检测，确认以下设置：
- **Framework Preset**: 选择 "Other"
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`

### 5. 域名配置
1. 进入项目 Settings → Domains
2. 添加自定义域名 `upfef.com`
3. 按提示配置 DNS 记录

### 6. 部署
点击 "Deploy" 按钮，等待构建完成。

---

## 二、阿里云 Supabase 配置

### 1. 获取 Supabase 配置
1. 登录阿里云 Supabase 控制台
2. 进入你的项目
3. 点击左侧 "Project Settings" → "API"
4. 复制以下信息：
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public**: `your-anon-key`

### 2. 配置 CORS（如需跨域）
在 Supabase 控制台 → Database → Extensions → 启用 `pg_net` 扩展

### 3. 数据库迁移（如需要）
如果数据库结构有变更，执行迁移：
```bash
meoo-cli cloud migrate --sql "..."
```

---

## 三、部署后检查清单

### 功能检查
- [ ] 首页正常加载
- [ ] 用户注册/登录功能正常
- [ ] 个人主页能正常显示
- [ ] 动态发布功能正常
- [ ] 管理后台需要登录且仅管理员可访问
- [ ] 留言板功能正常

### SEO 检查
- [ ] 站点地图可访问 `/sitemap.xml`
- [ ] 各页面标题正常显示
- [ ] 动态详情页有独立 URL

### 性能检查
- [ ] 首屏加载时间 < 3秒
- [ ] 图片正常加载
- [ ] 无控制台报错

---

## 四、常见问题

### Q: 构建失败怎么办？
A: 检查以下几点：
1. 环境变量是否正确设置
2. `pnpm install` 是否成功
3. 查看 Vercel 构建日志

### Q: Supabase 连接失败？
A: 检查：
1. `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 是否正确
2. Supabase 项目是否正常运行
3. 网络是否可访问 Supabase

### Q: 如何更新部署？
A: 推送代码到 GitHub 后，Vercel 会自动重新部署。

---

## 五、文件说明

```
/home/project/
├── .env.example          # 环境变量示例
├── DEPLOY.md             # 本部署文档
├── dist/                 # 构建输出目录（自动生成）
├── public/               # 静态资源
│   └── sitemap.xml       # 站点地图
├── src/                  # 源代码
│   ├── pages/            # 页面组件
│   ├── components/       # 公共组件
│   ├── utils/            # 工具函数
│   └── supabase/         # Supabase 客户端
├── functions/            # Edge Functions
├── package.json          # 项目配置
├── webpack.config.js     # Webpack 配置
└── tsconfig.json         # TypeScript 配置
```

---

## 六、联系方式

如有问题，请检查：
1. Vercel 部署日志
2. 浏览器控制台报错
3. Supabase 数据库状态
