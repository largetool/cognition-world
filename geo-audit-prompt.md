# uptef.com GEO/SEO 审计 Prompt

## 背景
这是一个面向全球化的个人 GEO 平台，核心承诺是"让 AI 认识每一个具体的普通人"。基于 Next.js + SSR + Supabase 构建，部署在 Vercel。用户路由格式 `/000000000`，日志路由 `/000000000/thought/{uuid}`。

最近完成了一轮大改版：Next.js 迁移（22 页面 + SSR 用户页）、JSON-LD 结构化数据注入、动态 sitemap 生成、阿里云安全审核接入。

## 审计要求

### 1. 首页（/）
截图 + 查看源码。检查：
- HTML `<title>` 是否正确
- `<meta name="description">` 是否存在且有内容
- `<meta property="og:title">`、`og:description`、`og:image`、`og:type`、`og:url` 是否完整
- `<link rel="canonical">` 是否存在
- `<script type="application/ld+json">` 中是否有 `WebSite` 和 `Organization` 两个 schema
- 这些 JSON-LD 是在 HTML 源码中直接出现（SSR），还是需要通过 JS 才能看到（客户端渲染）
- 页面有没有有效的导航链接指向真实用户页（不是示例页）

### 2. 真实用户页（选择一个，比如首页推荐的或者 sitemap 里的）
截图 + 查看源码。检查：
- og:title 是"xxx - 认知界"还是平台默认标题
- og:type 是否是 `profile`
- canonical URL 是否正确指向用户页
- JSON-LD 中是否有 `ProfilePage` + `Person` schema
- Person schema 中是否包含：name、alternateName、jobTitle、description、identifier（display_id）、address（addressLocality）、url
- 是否有最近日志的 `BlogPosting` schema

### 3. 日志详情页
打开一条日志，检查：
- 是否有 `BlogPosting` schema
- headline、articleBody、author、datePublished 是否正确
- 是否有 about（标签）字段
- contentLocation（如果用户填了位置）

### 4. sitemap.xml
- 直接访问 /sitemap.xml，查看内容
- URL 格式是否为数字 ID（如 `/000000000/thought/uuid`）而不是 UUID 直接
- 是否包含首页 + 所有用户日志
- 提交一次到 Google Search Console

### 5. robots.txt
- 是否允许所有爬虫
- sitemap 地址是否正确

### 6. 对比上次审计的问题
上次（约 2 周前）发现的问题：
- ❌ 用户页 meta 是平台默认值，不是用户专属 → 预期已修复
- ❌ JSON-LD 全站为零 → 预期已修复
- ❌ 示例页内容渲染两次（重复 DOM） → 需要检查
- ❌ 日志中有字面量 \n 字符 → 需要检查是否有新日志仍然出现
- ❌ 用户页对爬虫是黑洞（无发现路径） → sitemap 预期已修复

## 输出格式
请按以下结构输出：
1. 首页审计结果
2. 用户页审计结果
3. 日志详情页审计结果
4. sitemap/robots 审计结果
5. 与上次对比：哪些修了，哪些没修
6. 优先级排序：剩余问题的紧急程度
7. 截图（每个页面至少一张）
