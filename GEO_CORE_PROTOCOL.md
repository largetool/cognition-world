# GEO Core Protocol — 认知界

> 版本: 1.0.0 | 更新: 2026-06-30

认知界的核心 GEO（Generative Engine Optimization）协议：如何让 AI 搜索引擎和 LLM 理解、索引、引用用户内容。

---

## 一、协议目标

1. **可发现** — AI 引擎能通过爬虫发现所有公开页面
2. **可理解** — AI 引擎能解析页面内容、用户身份、信息关系
3. **可引用** — AI 引擎能在回答中引用用户内容并给出归因链接

## 二、分层实现

### L1 — 基础设施层

| 组件 | 路径 | 说明 |
|------|------|------|
| Robots.txt | `/robots.txt` | `Allow: /`，指向 sitemap |
| Sitemap | `/api/sitemap` | 动态 XML，覆盖首页 + 用户页 + 日志页 |
| LLMs.txt | `/llms.txt` | 面向 LLM 的站点说明 |
| Hreflang | 各页面 head | zh-CN / en / x-default |
| Canonical URL | 各页面 head | 防止重复内容 |

### L2 — 渲染层

- **SSR**（Server-Side Rendering）：所有公开页使用 `getServerSideProps`，爬虫无需 JS 即可获取完整 HTML
- **爬虫检测**：根据 User-Agent 判断爬虫，渲染纯 HTML 结构；人类用户渲染 SPA
- **缓存策略**：sitemap 和 llms.txt 设有 `Cache-Control: public, max-age=3600, s-maxage=86400`

### L3 — 结构化数据层

所有页面使用 Schema.org 标准 JSON-LD：

| 页面类型 | Schema 类型 | 关键字段 |
|----------|------------|----------|
| 首页 | `WebSite` + `Organization` + `FAQPage` + `BreadcrumbList` | name, description, url, logo |
| 用户主页 | `ProfilePage` + `Person` + `BlogPosting[]` + `BreadcrumbList` | name, description, identifier, location |
| 日志详情 | `SocialMediaPosting` + `BreadcrumbList` | text, author, datePublished, about(tags) |
| 内容页 | `WebPage` + `BreadcrumbList` | headline, description, breadcrumb |

### L4 — AI 增强层

- **Agnes API**（agnes-2.0-flash）：为用户生成 `Person.description`（第三人称简介）
- **批量富化**：每日 03:01 AM 自动执行 `/api/geo/batch-enrich`，扫描无 bio 用户并生成
- **GEO API**：`/api/geo/enrich?displayId={id}` 手动触发单用户富化
- **Edge Function**：Supabase Edge Function 输出纯 JSON-LD（`application/ld+json`）

### L5 — 元数据层

- Open Graph（og:title, og:description, og:image, og:url）
- Twitter Card（summary_large_image）
- Meta keywords + description（每页独立）
- 文章型（article:author, article:published_time）

## 三、Schema 字段映射

### Person（用户主体）

```json
{
  "@type": "Person",
  "name": "用户名",
  "description": "AI 生成简介（geo_bio）或 slogan",
  "identifier": "display_id（9位补零）",
  "location": "所在地",
  "url": "https://uptef.com/{displayId}"
}
```

### ProfilePage（用户主页）

```json
{
  "@type": "ProfilePage",
  "mainEntity": { "@id": "#person" },
  "dateCreated": "注册时间",
  "about": "用户 tag"
}
```

### BlogPosting（认知日志）

```json
{
  "@type": "BlogPosting",
  "headline": "日志内容前 20 字",
  "text": "日志内容",
  "author": { "@id": "#person" },
  "datePublished": "发布时间",
  "about": ["标签1", "标签2"]
}
```

## 四、支持的 AI 引擎

- Google / Google AI Overview
- Bing / Microsoft Copilot
- ChatGPT (Search)
- Claude (Search)
- Perplexity
- 通义千问
- Kimi
- DeepSeek

## 五、维护说明

| 操作 | 频率 | 方式 |
|------|------|------|
| 批量 GEO 富化 | 每日 | 定时任务 `daily-geo-batch-enrich` |
| sitemap 更新 | 每次部署 | `/api/sitemap` 实时生成 |
| llms.txt 更新 | 内容变更时 | `/api/llms` 手动更新 |
| GEO 状态审计 | 每周 | 运行 `geo-audit-prompt.md` |
