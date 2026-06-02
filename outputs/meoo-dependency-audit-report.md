# MEOO 平台依赖项审计报告

## 审计概述

**审计日期**: 2026-06-02  
**审计范围**: 认知界 (Cognition World) 项目全代码库  
**目标**: 评估从 MEOO 平台迁移到 Vercel + 独立 Supabase 的可行性

---

## 问题 1：文件存储

### 当前状态

**✅ 不依赖 MEOO，使用 Supabase Storage**

用户上传的头像、背景图等文件存储在 **Supabase Storage** 的 `backgrounds` bucket 中。

**代码位置**: `src/utils/storage.ts:23-28`
```typescript
const { data, error } = await supabase.storage
  .from('backgrounds')
  .upload(fileName, decode(base64), { contentType: file.type });
```

### 迁移影响

**✅ 无影响，可直接迁移**

- 文件存储使用标准 Supabase Storage API
- 图片 URL 格式为 Supabase 标准格式，非 MEOO 特有
- 迁移后只需确保新 Supabase 项目有 `backgrounds` bucket

### 建议操作

1. 在新 Supabase 项目中创建 `backgrounds` bucket
2. 设置适当的 RLS 策略允许用户上传
3. 如需迁移现有文件，使用 Supabase Storage 导出/导入工具

---

## 问题 2：构建和部署

### 当前状态

**✅ 标准 Webpack 构建，无 MEOO 特有配置**

**构建配置**: `webpack.config.js`
- 使用标准 Webpack 5 + Babel
- 输出目录 `dist/` 包含标准静态文件
- 无 MEOO 特有插件或配置

**public/clear-cache.html**:
- 这是一个通用的缓存清除页面
- 使用标准 localStorage/sessionStorage API
- **非 MEOO 特有**，在其他环境也有用

### 迁移影响

**✅ 可直接在 Vercel 部署**

构建输出 `dist/` 包含：
- `index.html` - 入口文件
- `bundle.js` - 主 JS 包
- 其他静态资源

Vercel 可直接部署这些静态文件。

### 建议操作

1. 在 Vercel 项目设置中配置构建命令：`npm run build`
2. 输出目录设置为 `dist`
3. 添加 `vercel.json` 配置路由重写（SPA 模式）

---

## 问题 3：网络请求

### 当前状态

**⚠️ 发现一处 MEOO 特有代码**

**问题代码**: `src/supabase/client.ts:4-12`
```typescript
function getSupabaseUrl(): string {
  const meooConfig = (window as any).MEOO_CONFIG;
  if (meooConfig?.meoo_app_access_url) {
    return `${meooConfig.meoo_app_access_url}/sb-api`;
  }
  // 回退到当前域名
  return `${window.location.origin}/sb-api`;
}
```

**分析**:
- 代码尝试读取 `window.MEOO_CONFIG.meoo_app_access_url`
- 这是 MEOO 平台注入的配置对象
- 但有回退逻辑：如果 MEOO_CONFIG 不存在，使用 `window.location.origin`

### 迁移影响

**✅ 低影响，回退逻辑可用**

在非 MEOO 环境：
- `window.MEOO_CONFIG` 为 `undefined`
- 函数回退到 `window.location.origin + '/sb-api'`
- 需要确保新 Supabase URL 配置正确

### 修复方案

**建议修改** `src/supabase/client.ts`：

```typescript
// 迁移后使用硬编码的 Supabase URL
const SUPABASE_URL = 'https://nbgsichilfrjsopnnvia.supabase.co';
// 或从环境变量读取
// const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nbgsichilfrjsopnnvia.supabase.co';
```

---

## 问题 4：认证

### 当前状态

**✅ 使用 Supabase Auth，不依赖 MEOO**

**认证方式**:
- 基于 Supabase Auth 的用户名/密码登录
- 使用虚拟邮箱格式：`{username}@meoo.local`
- 密码找回通过 Edge Function `send-email` 和 `reset-password`

**邮件服务**: `functions/send-email/index.ts`
- 使用 **Resend API** 发送邮件
- API Key 硬编码在代码中（测试环境）
- 生产环境应从环境变量读取

### 迁移影响

**✅ 认证系统可直接使用**

- Supabase Auth 是标准服务，与部署平台无关
- 用户数据存储在 Supabase 数据库中
- 迁移后用户可正常登录

### 建议操作

1. 在新 Supabase 项目中配置 Auth 设置
2. 更新邮件发送函数，使用生产环境 Resend API Key
3. 配置邮件发送域名（从 `onboarding@resend.dev` 改为自定义域名）

---

## 问题 5：定时任务/后台任务

### 当前状态

**✅ 无 MEOO 特有定时任务**

**代码分析**:
- 项目中无 Cron 任务配置
- 无依赖 MEOO 定时服务的代码
- "10分钟冷静期"等功能通过前端逻辑实现（`setTimeout`）

**相关代码**: `src/utils/storage.ts:170`
```typescript
const publishedAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10分钟后
```

这是前端计算发布时间，非后台定时任务。

### 迁移影响

**✅ 无影响**

项目不依赖任何平台特有的定时任务服务。

---

## 问题 6：域名和 HTTPS

### 当前状态

**⚠️ 需要重新配置**

**当前配置**:
- 域名 `uptef.com`（根据文档）
- MEOO 平台提供自动 HTTPS

**代码中的域名引用**:
- `src/config/index.ts` 中 `APP_CONFIG.url` 需要更新
- SEO 相关代码中的 canonical URL

### 迁移影响

**⚠️ 需要手动配置**

迁移到 Vercel 后：
1. 在 Vercel 项目设置中添加自定义域名 `uptef.com`
2. 在域名 DNS 服务商处配置 CNAME 指向 Vercel
3. Vercel 自动提供 HTTPS 证书

### 建议操作

1. 更新 `src/config/index.ts` 中的 `APP_CONFIG.url`
2. 在 Vercel 控制台添加域名
3. 配置 DNS 解析

---

## 问题 7：MEOO 专有功能

### 当前状态

**⚠️ 发现 Iframe 主题监听代码**

**代码位置**: `index.html:25-51`
```javascript
(function() {
  const isInIframe = window.self !== window.top;

  function applyThemeToDOM(theme) {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  if (isInIframe) {
    // 监听父窗口主动推送的主题消息
    window.addEventListener('message', function(event) {
      if (event.data && typeof event.data.theme === 'string') {
        const theme = event.data.theme;
        if (theme === 'light' || theme === 'dark') {
          applyThemeToDOM(theme);
        }
      }
    });
  } else {
    // 非 iframe 环境，使用默认 light 主题
    applyThemeToDOM('light');
  }
})();
```

**分析**:
- 这段代码监听父窗口通过 `postMessage` 发送的主题消息
- 仅在 MEOO 平台的 iframe 预览模式中有用
- 在普通浏览器中：
  - 检测非 iframe 环境
  - 使用默认 light 主题
  - **无副作用**

### 迁移影响

**✅ 无负面影响**

代码在非 iframe 环境有安全的回退逻辑，不会导致错误。

### 可选优化

可以保留此代码，或简化为主题检测逻辑：
```javascript
// 简化版本
(function() {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.classList.add(theme);
  document.documentElement.setAttribute('data-theme', theme);
})();
```

---

## 总结

### 依赖程度评估

| 问题 | 依赖程度 | 迁移难度 |
|------|---------|---------|
| 文件存储 | 无 | ⭐ 简单 |
| 构建部署 | 无 | ⭐ 简单 |
| 网络请求 | 低 | ⭐⭐ 需修改一处代码 |
| 认证 | 无 | ⭐ 简单 |
| 定时任务 | 无 | ⭐ 简单 |
| 域名 HTTPS | 中 | ⭐⭐⭐ 需配置 |
| MEOO 专有功能 | 低 | ⭐ 可选优化 |

### 迁移前必须完成的操作

1. **修改 Supabase URL 配置** (`src/supabase/client.ts`)
   - 移除 `window.MEOO_CONFIG` 依赖
   - 使用硬编码或环境变量

2. **配置 Vercel 项目**
   - 设置构建命令和输出目录
   - 添加环境变量

3. **配置域名**
   - 在 Vercel 添加 `uptef.com`
   - 更新 DNS 解析

4. **准备 Supabase 环境**
   - 创建 `backgrounds` storage bucket
   - 配置 Auth 设置
   - 部署 Edge Functions

### 迁移后验证清单

- [ ] 用户可正常注册/登录
- [ ] 头像/背景图上传正常
- [ ] 邮件发送功能正常
- [ ] 所有页面可正常访问
- [ ] HTTPS 证书生效
- [ ] SEO 元数据正确

---

**审计完成** - 项目整体迁移难度较低，主要工作集中在配置迁移而非代码修改。
