# 认知界 SEO & GEO 技术规范文档

> 版本: 1.1.0
> 更新日期: 2026-06-05
> 适用平台: 认知界 (Cognition World) - 全民 GEO 公开信息平台
> 实际域名: https://uptef.com

---

## 目录

1. [全局 SEO 规则](#一全局-seo-规则)
2. [全局 GEO (JSON-LD) 规则](#二全局-geo-json-ld-规则)
3. [用户页面规则](#三用户页面规则)
4. [示例页面规则](#四示例页面规则)
5. [互动内容规则](#五互动内容规则)
6. [标注内容规则](#六标注内容规则)
7. [URL 规范](#七url-规范)
8. [Sitemap 规范](#八sitemap-规范)
9. [Robots 规范](#九robots-规范)
10. [LLM 抓取优化规则](#十llm-抓取优化规则)
11. [当前架构限制与改造计划](#十一当前架构限制与改造计划)

---

## 一、全局 SEO 规则

### 1.1 基础配置常量

```typescript
APP_CONFIG = {
  name: '认知界',                          // 平台中文名
  nameEn: 'Cognition World',               // 平台英文名
  subTitle: '全民 GEO 公开信息平台',       // 副标题
  slogan: '让AI认识每一个具体的普通人',    // 宣传语
  description: '一个面向全球用户的公开信息平台，提供不可删除、不可篡改、可索引的个人 GEO 信誉记录，让搜索引擎与 LLM 能够理解每个用户。',
  url: 'https://uptef.com',                // 实际域名（更新于 2026-06-05）
  geoAnchor: 'Beijing, CN',
  timeAnchor: '2026.04.26',
}
```

### 1.2 默认 SEO 数据模板

**适用场景**: 首页、未匹配到具体用户的页面、错误页面

| 字段 | 值 | 说明 |
|------|-----|------|
| title | `面向全球化的个人黄页索引｜全民 GEO 公开信息平台` | 主标题，包含核心关键词 |
| description | APP_CONFIG.description | 平台描述，150字符以内 |
| keywords | `['个人主页', '黄页', 'AI', '认知', '索引', 'GEO', '全民 GEO', 'Cognition World']` | 核心关键词列表 |
| ogType | `website` | OpenGraph 类型 |
| canonicalUrl | `https://uptef.com` | 规范URL |

### 1.3 Meta 标签注入规则

采用**双层注入**策略：

#### 第一层：静态注入（index.html 硬编码）

确保爬虫无需执行 JS 即可读到关键信息。

```html
<title>认知界 - 让AI认识每一个具体的普通人</title>
<meta name="description" content="一个面向全球用户的公开信息平台...">
<meta name="keywords" content="个人主页,黄页,AI,认知,索引,GEO...">
<link rel="canonical" href="https://uptef.com/">

<meta property="og:title" content="认知界 - 让AI认识每一个具体的普通人">
<meta property="og:description" content="...">
<meta property="og:type" content="website">
<meta property="og:url" content="https://uptef.com/">
<meta property="og:image" content="https://placehold.co/1200x630/1a1a2e/e6e6e6?text=认知界&font=raleway">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="认知界 - 让AI认识每一个具体的普通人">
<meta name="twitter:description" content="面向全球化的个人黄页索引，让 AI 认识每一个具体的普通人。">
```

#### 第二层：动态注入（SEOHead 组件）

通过 SEOHead 组件在 useEffect 中对每页进行补充注入：

1. **基础 SEO 标签**: description, keywords
2. **OpenGraph 标签**: og:title, og:description, og:type, og:image, og:url
3. **Twitter Card 标签**: twitter:card, twitter:title, twitter:description, twitter:image
4. **Canonical 标签**: link[rel="canonical"]
5. **hreflang 标签**: 多语言版本（zh-CN, en, x-default）

**注入逻辑**:
- 如果标签已存在，更新其 content 属性
- 如果标签不存在，创建新元素并追加到 document.head
- 空值标签会被跳过，不注入

### 1.4 安全降级策略

当 SEO 数据不完整时：

```typescript
DEFAULT_TITLE = '认知界 - 让AI认识每一个具体的普通人'
DEFAULT_DESCRIPTION = '面向全球化的个人黄页索引，让 AI 认识每一个具体的普通人'
```

---

## 二、全局 GEO (JSON-LD) 规则

### 2.1 结构化数据注入方式

采用**双层注入**策略：

1. **静态注入**: `index.html` 中硬编码 WebSite + Organization（首页通用，确保 AI 爬虫可读）
2. **动态注入**: SEOHead 组件在每页的 useEffect 中补充/覆盖

**注入规则**:
- 动态注入前清除已存在的同类型 JSON-LD 脚本
- 使用 JSON.stringify 序列化数据
- 追加到 document.head 末尾

### 2.2 WebSite 结构化数据

**适用页面**: 首页（同时静态注入 index.html）

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "面向全球化的个人黄页索引",
  "alternateName": "全民GEO公开信息平台",
  "url": "https://uptef.com/",
  "description": "一个公开、可验证、不可删除的个人 GEO 信息平台。",
  "inLanguage": "zh-CN",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://uptef.com/#/search?q={search_term_string}"
  }
}
```

### 2.3 Organization 结构化数据

**适用页面**: 首页（同时静态注入 index.html）

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "认知界",
  "alternateName": "Cognition World",
  "url": "https://uptef.com/",
  "description": "一个面向全球用户的公开信息平台，提供不可删除、不可篡改、可索引的个人 GEO 信誉记录，让搜索引擎与 LLM 能够理解每个用户。"
}
```

### 2.4 Person 结构化数据

**适用页面**: 用户个人页面

| 字段 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| @type | string | `Person` | 类型标识 |
| name | string | `张明远` | 用户昵称 |
| alternateName | string | `USER001` | 用户ID（备用名） |
| jobTitle | string | `软件工程师` | 身份标签 |
| description | string | `热爱技术，喜欢摄影...` | 个人Slogan |
| url | string | `https://uptef.com/#/USER001` | 个人页面URL |

### 2.5 ProfilePage 结构化数据

**适用页面**: 用户个人页面

| 字段 | 类型 | 说明 |
|------|------|------|
| @type | string | `ProfilePage` |
| mainEntity | Person | 嵌套 Person 对象 |
| url | string | `https://uptef.com/#/{user_id}` |

### 2.6 BlogPosting 结构化数据

**适用场景**: 单条认知日志（可选）

| 字段 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| @type | string | `BlogPosting` | 类型标识 |
| headline | string | `今天完成了一个复杂的算法优化项目...` | 日志前60字符 |
| articleBody | string | `今天完成了一个复杂的算法优化项目...` | 完整日志内容 |
| author | Person | `{@type: 'Person', name: '张明远'}` | 作者信息 |
| datePublished | string | `2025-01-10T09:30:00Z` | ISO 8601 格式发布时间 |

---

## 三、用户页面规则

### 3.1 页面 SEO 数据生成

**生成函数**: `getUserSEO(profile)`

| 字段 | 生成逻辑 | 示例 |
|------|----------|------|
| title | `{username} - 认知界` | `张明远 - 认知界` |
| description | `slogan` 或 `{tag} \| 认知界` | `热爱技术，喜欢摄影...` |
| keywords | `[username, tag, user_id, '个人主页']` | `['张明远', '软件工程师', 'USER001', '个人主页']` |
| ogType | `profile` | - |
| canonicalUrl | `https://uptef.com/#/{user_id}` | `https://uptef.com/#/USER001` |

**安全降级**:
- 如果 profile 为 null/undefined，返回默认 SEO
- 如果字段缺失，使用空字符串或默认值填充

### 3.2 用户页面 JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "name": "username - 认知界",
  "description": "个人Slogan",
  "url": "https://uptef.com/#/USER001",
  "mainEntity": {
    "@type": "Person",
    "name": "用户名",
    "alternateName": "用户ID",
    "jobTitle": "身份标签",
    "description": "个人Slogan",
    "url": "https://uptef.com/#/USER001"
  }
}
```

### 3.3 可索引性控制

**公开页面** (is_public = true):
- 允许搜索引擎索引
- 允许 LLM 抓取
- 显示完整结构化数据

**私密页面** (is_public = false):
- meta robots: noindex（待实现）

---

## 四、示例页面规则

**URL**: `https://uptef.com/#/example/000000001`

**SEO 数据**:

| 字段 | 值 |
|------|-----|
| title | `示例用户页面 - 认知界｜全民 GEO 公开信息平台` |
| description | `这是一个示例用户页面，展示认知界平台的个人主页样式和功能...` |
| keywords | `['示例', '个人主页', '黄页', 'GEO', '认知界', 'Cognition World']` |
| ogType | `profile` |
| canonicalUrl | `https://uptef.com/#/example/000000001` |

**JSON-LD**: 包含 `"example": true` 标记

**示例提示**: 页面顶部显示琥珀色背景横幅："此页面为示例页面，不代表真实用户。"

---

## 五、互动内容规则

### 5.1 认知日志时间显示

**格式**: `MM-DD HH:mm` (24小时制)

```typescript
new Date(log.created_at).toLocaleString('zh-CN', {
  month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false
})
```

### 5.2 分享功能

1. 优先使用 `navigator.share` API（移动端原生分享）
2. 不支持时回退到 `navigator.clipboard.writeText`（复制链接）

**分享数据**: title = `{username} - 认知界`, text = slogan/tag, url = 当前页面URL

---

## 六、标注内容规则

### 6.1 数字 ID 系统

```typescript
String(display_id ?? 0).padStart(9, '0')
```

### 6.2 用户 ID 系统

```typescript
username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'USER'
```

### 6.3 公开性标识

- 公开: Eye 图标 + "公开"
- 私密: EyeOff 图标 + "私密"

---

## 七、URL 规范

### 7.1 路由结构（Hash 路由）

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | IndexPage | 首页 |
| `/#/register` | RegisterPage | 注册页 |
| `/#/login` | LoginPage | 登录页 |
| `/#/me` | MePage | 个人中心（需登录） |
| `/#/{userId}` | UserPage | 用户公开页 |
| `/#/example/{userId}` | ExamplePage | 示例页面 |
| `/#/whitepaper` | WhitepaperPage | 白皮书 |
| `/#/terms` | TermsPage | 用户协议 |
| `/#/privacy` | PrivacyPage | 隐私政策 |
| `/#/about` | AboutPage | 关于我们 |
| `/#/contact` | ContactPage | 联系我们 |
| `/#/guestbook` | GuestbookPage | 留言板 |

### 7.2 URL 生成规则

**用户页面**: `https://uptef.com/#/{user_id}`
**示例**: `https://uptef.com/#/USER001`

### 7.3 与 History 路由对比

| 特性 | Hash 路由（当前） | History 路由（待迁移） |
|------|-----------------|---------------------|
| URL 格式 | `/#/USER001` | `/user/USER001` |
| Google 索引 | 有限支持 | 完全支持 |
| Bing/百度索引 | 不支持 | 完全支持 |
| Vercel rewrite | 不需要 | 需配置 |

---

## 八、Sitemap 规范

### 8.1 Sitemap 位置

`https://uptef.com/sitemap.xml`

### 8.2 当前内容

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://uptef.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://uptef.com/#/whitepaper</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://uptef.com/#/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://uptef.com/#/guestbook</loc>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://uptef.com/#/example/000000001</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
```

### 8.3 待实现：动态 Sitemap

迁移到 SSR 后，用户页面应通过 Vercel Serverless Function 动态生成并自动提交到 Google/Bing。

---

## 九、Robots 规范

### 9.1 Robots.txt

```
User-agent: *
Allow: /
Sitemap: https://uptef.com/sitemap.xml
```

### 9.2 Meta Robots

**公开页面**: `<meta name="robots" content="index, follow">`
**私密页面**: `<meta name="robots" content="noindex, follow">`（待实现）

---

## 十、LLM 抓取优化规则

### 10.1 结构化数据

- 首页: `index.html` 静态注入 WebSite + Organization（AI 爬虫无需 JS 即可读取）
- 用户页: JS 动态注入 ProfilePage + Person（**待 SSR 后对 AI 爬虫可见**）

### 10.2 平台描述（首页 HTML 壳中已硬编码）

```
认知界是一个面向全球化的个人黄页索引平台，属于全民 GEO 公开信息平台。
平台特点：
1. 内容不可删除、不可篡改、不可撤回
2. 所有公开内容可被搜索引擎和 LLM 索引
3. 建立公开可信的用户信誉记录
4. 防止诈骗、滥用与虚假行为
```

### 10.3 用户页面描述模板（待 SSR 后生效）

```
{username} 是认知界平台的用户，身份标签为 {tag}，
位于 {location}，数字ID为 {display_id}。
个人简介：{slogan}
```

---

## 十一、当前架构限制与改造计划

### 11.1 现有问题

| 问题 | 严重程度 | 影响 | 当前状态 |
|------|---------|------|---------|
| React SPA 无 SSR | 🔴 致命 | 爬虫看不到 JS 渲染的内容 | 待解决 |
| Hash 路由 | 🟡 中等 | 非 Google 搜索引擎索引差 | 待迁移 |
| 用户页 JSON-LD 由 JS 注入 | 🔴 致命 | AI 爬虫抓不到用户结构化数据 | 待解决 |
| 无动态 sitemap | 🟡 中等 | 新用户不自动出现在 sitemap | 待解决 |

### 11.2 短期修复（已完成 2026-06-05）

- [x] Sitemap URL 格式修正为 `/#/` hash 格式
- [x] index.html 硬编码 title、meta description、OpenGraph、Twitter Card
- [x] index.html 硬编码 WebSite + Organization JSON-LD
- [x] 规范文档域名从 cognition.world 改为 uptef.com

### 11.3 中长期改造计划

| 阶段 | 内容 | 目标 | 优先级 |
|------|------|------|--------|
| 一 | 改造 Next.js + SSR | 爬虫可见用户内容 | 🔴 最高 |
| 二 | 切换到 History 路由 | 兼容所有搜索引擎 | 🟡 高 |
| 三 | 动态生成 sitemap | 爬虫发现所有页面 | 🟡 高 |
| 四 | 自动提交 sitemap 到 Google/Bing | 加速索引 | 🟢 中 |

---

## 附录 A: 文件位置索引

| 文件 | 路径 | 说明 |
|------|------|------|
| 首页 HTML 壳 | `index.html` | 静态 SEO/GEO 硬编码 |
| SEO 工具函数 | `src/utils/seo.ts` | 结构化数据生成函数 |
| SEO 组件 | `src/components/SEOHead.tsx` | JS 端 Meta 注入组件 |
| 类型定义 | `src/types/index.ts` | SEOData, Profile, APP_CONFIG |
| Sitemap | `public/sitemap.xml` | 站点地图 |
| Robots | `public/robots.txt` | 爬虫规则 |
| Vercel 配置 | `vercel.json` | 部署路由 |

## 附录 B: 更新记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0.0 | 2026-05-03 | 初始版本（cognition.world 域名） |
| 1.1.0 | 2026-06-05 | 域名改为 uptef.com；新增首页静态 SEO/GEO 硬编码策略；新增架构限制与改造计划章节；删除过期的互动/标注内容章节 |
