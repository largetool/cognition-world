# 认知界 SEO & GEO 技术规范文档

> 版本: 1.0.0  
> 更新日期: 2026-05-03  
> 适用平台: 认知界 (Cognition World) - 全民 GEO 公开信息平台

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
  url: 'https://cognition.world',          // 主域名
  geoAnchor: 'Beijing, CN',                // 地理锚点
  timeAnchor: '2026.04.26',                // 时间锚点
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
| canonicalUrl | `https://cognition.world` | 规范URL |

### 1.3 Meta 标签注入规则

**注入方式**: 通过 SEOHead 组件在 useEffect 中动态注入

**注入的 Meta 标签列表**:

1. **基础 SEO 标签**
   - `description`: 页面描述
   - `keywords`: 关键词（逗号分隔）

2. **OpenGraph 标签**（用于社交媒体分享）
   - `og:title`: 页面标题
   - `og:description`: 页面描述
   - `og:type`: 页面类型（website/profile）
   - `og:image`: 分享图片（可选）
   - `og:url`: 规范URL

3. **Twitter Card 标签**
   - `twitter:card`: `summary_large_image`
   - `twitter:title`: 页面标题
   - `twitter:description`: 页面描述
   - `twitter:image`: 分享图片（可选）

4. **Canonical 标签**
   - `link[rel="canonical"]`: 规范URL，用于解决重复内容问题

**注入逻辑**:
- 如果标签已存在，更新其 content 属性
- 如果标签不存在，创建新元素并追加到 document.head
- 空值标签会被跳过，不注入

### 1.4 安全降级策略

当 SEO 数据不完整时，使用以下默认值:

```typescript
DEFAULT_TITLE = '认知界 - 让AI认识每一个具体的普通人'
DEFAULT_DESCRIPTION = '面向全球化的个人黄页索引，让 AI 认识每一个具体的普通人'
```

---

## 二、全局 GEO (JSON-LD) 规则

### 2.1 结构化数据注入方式

通过 SEOHead 组件的 jsonLd 参数注入，在 useEffect 中创建 script[type="application/ld+json"] 标签。

**注入规则**:
- 每次注入前清除已存在的 JSON-LD 脚本（避免重复）
- 使用 JSON.stringify 序列化数据
- 追加到 document.head 末尾

### 2.2 WebSite 结构化数据

**适用页面**: 首页

**Schema 类型**: `WebSite`

**字段定义**:

| 字段 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| @context | string | `https://schema.org` | Schema.org 上下文 |
| @type | string | `WebSite` | 类型标识 |
| name | string | `面向全球化的个人黄页索引` | 网站主名称 |
| alternateName | string | `全民 GEO 公开信息平台` | 网站别名 |
| url | string | `https://cognition.world` | 网站URL |
| description | string | `一个公开、可验证、不可删除的个人 GEO 信息平台。` | 网站描述 |
| inLanguage | string | `zh-CN` | 语言代码 |
| potentialAction | object | SearchAction | 搜索操作定义 |

**SearchAction 子字段**:
- `@type`: `SearchAction`
- `target`: `https://cognition.world/#/search?q={search_term_string}`

### 2.3 Organization 结构化数据

**适用页面**: 首页

**Schema 类型**: `Organization`

**字段定义**:

| 字段 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| @type | string | `Organization` | 类型标识 |
| name | string | `认知界` | 组织名称 |
| url | string | `https://cognition.world` | 组织URL |
| description | string | APP_CONFIG.description | 组织描述 |

### 2.4 Person 结构化数据

**适用页面**: 用户个人页面

**Schema 类型**: `Person`

**字段定义**:

| 字段 | 类型 | 示例值 | 说明 |
|------|------|--------|------|
| @type | string | `Person` | 类型标识 |
| name | string | `张明远` | 用户昵称 |
| alternateName | string | `USER001` | 用户ID（备用名） |
| jobTitle | string | `软件工程师` | 身份标签 |
| description | string | `热爱技术，喜欢摄影...` | 个人Slogan |
| url | string | `https://cognition.world/#/USER001` | 个人页面URL |

### 2.5 ProfilePage 结构化数据

**适用页面**: 用户个人页面

**Schema 类型**: `ProfilePage`

**字段定义**:

| 字段 | 类型 | 说明 |
|------|------|------|
| @type | string | `ProfilePage` |
| mainEntity | Person | 嵌套 Person 对象 |

### 2.6 BlogPosting 结构化数据

**适用场景**: 单条认知日志（可选，用于日志详情页）

**Schema 类型**: `BlogPosting`

**字段定义**:

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

**输入参数**:
- profile: 用户资料对象

**输出规则**:

| 字段 | 生成逻辑 | 示例 |
|------|----------|------|
| title | `{username} - 认知界` | `张明远 - 认知界` |
| description | `slogan` 或 `{tag} | 认知界` | `热爱技术，喜欢摄影...` |
| keywords | `[username, tag, user_id, '个人主页']` | `['张明远', '软件工程师', 'USER001', '个人主页']` |
| ogType | `profile` | - |
| canonicalUrl | `{APP_CONFIG.url}/#/{user_id}` | `https://cognition.world/#/USER001` |

**安全降级**:
- 如果 profile 为 null/undefined，返回默认 SEO
- 如果字段缺失，使用空字符串或默认值填充

### 3.2 用户页面 JSON-LD

**注入位置**: UserPage 组件

**数据结构**:
```json
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": {
    "@type": "Person",
    "name": "用户名",
    "alternateName": "用户ID",
    "jobTitle": "身份标签",
    "description": "个人Slogan",
    "url": "个人页面完整URL"
  }
}
```

### 3.3 可索引性控制

**公开页面** (is_public = true):
- 允许搜索引擎索引
- 允许 LLM 抓取
- 显示完整结构化数据

**私密页面** (is_public = false):
- 建议搜索引擎不索引（通过 meta robots 控制，待实现）
- 限制敏感信息展示

---

## 四、示例页面规则

### 4.1 页面定位

**URL 模式**: `/#/example/{display_id}`

**用途**: 展示平台功能和样式，供未注册用户预览

**示例用户固定数据**:
- display_id: 1
- user_id: `EXAMPLE001`
- username: `张明远`
- tag: `软件工程师`
- location: `浙江省杭州市`

### 4.2 示例页面 SEO 数据

| 字段 | 值 |
|------|-----|
| title | `示例用户页面 - 认知界｜全民 GEO 公开信息平台` |
| description | `这是一个示例用户页面，展示认知界平台的个人主页样式和功能...` |
| keywords | `['示例', '个人主页', '黄页', 'GEO', '认知界', 'Cognition World']` |
| ogType | `profile` |
| canonicalUrl | `https://cognition.world/#/example/000000001` |

### 4.3 示例页面 JSON-LD

**特殊标记**: 包含 `example: true` 字段，标识此为示例页面

```json
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "name": "示例用户页面",
  "description": "认知界平台示例用户页面",
  "url": "https://cognition.world/#/example/000000001",
  "example": true,
  "mainEntity": {
    "@type": "Person",
    "name": "张明远",
    "jobTitle": "软件工程师",
    "description": "热爱技术，喜欢摄影...",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "浙江省杭州市"
    }
  }
}
```

### 4.4 示例提示

页面顶部必须显示示例提示横幅：
- 文案: "此页面为示例页面，不代表真实用户。仅用于展示平台功能和样式。"
- 样式: 琥珀色背景 (bg-amber-50)

---

## 五、互动内容规则

### 5.1 认知日志时间显示

**显示格式**: `MM-DD HH:mm` (24小时制)

**生成方式**:
```typescript
new Date(log.created_at).toLocaleString('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})
```

**示例**: `01-10 09:30`

### 5.2 日志内容结构化

**单条日志 Schema** (可选实现):
- 类型: `BlogPosting`
- headline: 内容前60字符
- articleBody: 完整内容
- author: 用户 Person 对象
- datePublished: ISO 8601 格式时间

### 5.3 分享功能

**分享按钮位置**: 个人页面导航栏

**分享逻辑**:
1. 优先使用 `navigator.share` API（移动端原生分享）
2. 不支持时回退到 `navigator.clipboard.writeText`（复制链接）

**分享数据**:
- title: `{username} - 认知界`
- text: `slogan` 或 `tag`
- url: 当前页面完整URL

---

## 六、标注内容规则

### 6.1 数字 ID 系统

**字段名**: `display_id`

**格式**: 9位数字，不足前补零

**示例**: `000000001`

**显示方式**:
```typescript
String(display_id ?? 0).padStart(9, '0')
```

**分配规则**:
- 按注册时间顺序递增
- 从 0 开始（000000000）
- 数据库序列: `display_id_seq`

### 6.2 用户 ID 系统

**字段名**: `user_id`

**生成规则**:
```typescript
username.toUpperCase()
  .replace(/[^A-Z0-9]/g, '')  // 移除非字母数字字符
  .slice(0, 10)               // 截取前10位
  || 'USER'                   // 默认值为 USER
```

**示例**:
- 输入: `张明远`
- 输出: `USER`（因中文无匹配字符，使用默认值）
- 输入: `ZhangMing123`
- 输出: `ZHANGMING12`

### 6.3 公开性标识

**字段名**: `is_public`

**显示方式**:
- 公开: Eye 图标 + "公开" 文字
- 私密: EyeOff 图标 + "私密" 文字

---

## 七、URL 规范

### 7.1 路由结构

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | IndexPage | 首页 |
| `/#/register` | RegisterPage | 注册页 |
| `/#/login` | LoginPage | 登录页 |
| `/#/me` | MePage | 个人中心（需登录） |
| `/#/{userId}` | UserPage | 用户公开页 |
| `/#/example/{userId}` | ExamplePage | 示例页面 |

### 7.2 URL 生成规则

**用户页面 URL**:
```
{origin}/#/{user_id}
```

**示例**:
- `https://cognition.world/#/USER001`
- `https://cognition.world/#/ZHANGMING12`

**Canonical URL 规则**:
- 始终使用带 hash 的完整 URL
- 不包含查询参数
- 使用 HTTPS 协议

### 7.3 分享 URL 生成

```typescript
const url = `${window.location.origin}/#/${profile.user_id}`;
```

---

## 八、Sitemap 规范

### 8.1 静态页面

必须包含的静态页面:
- `/` (首页)
- `/#/example/000000001` (示例页面)

### 8.2 动态页面

用户页面动态生成:
- 所有 `is_public = true` 的用户页面
- URL 格式: `/#/{user_id}`

### 8.3 Sitemap 格式

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cognition.world/</loc>
    <lastmod>2026-05-03</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://cognition.world/#/example/000000001</loc>
    <lastmod>2026-05-03</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- 动态用户页面 -->
  <url>
    <loc>https://cognition.world/#/USER001</loc>
    <lastmod>2026-05-03</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
```

**注意**: 由于使用 Hash Router，sitemap 中的 URL 需要包含 `/#/` 路径。

---

## 九、Robots 规范

### 9.1 推荐 Robots.txt

```
User-agent: *
Allow: /
Allow: /#/example/

# 公开用户页面允许索引
Allow: /#/USER*

# 登录/注册页面建议不索引
Disallow: /#/login
Disallow: /#/register
Disallow: /#/me

Sitemap: https://cognition.world/sitemap.xml
```

### 9.2 Meta Robots 标签

**公开页面**:
```html
<meta name="robots" content="index, follow">
```

**私密页面** (待实现):
```html
<meta name="robots" content="noindex, follow">
```

### 9.3 可索引策略

**无条件公开**:
- 示例页面
- 用户公开页面 (is_public = true)
- 首页

**限制访问**:
- 个人中心 (/me) - 需登录
- 编辑功能 - 需登录

---

## 十、LLM 抓取优化规则

### 10.1 内容可读性优化

**文本内容**:
- 使用语义化 HTML 标签 (article, section, header, main)
- 避免纯图片展示重要信息
- 关键信息使用文字而非图标

**结构化数据**:
- 所有用户页面必须包含 JSON-LD
- 使用标准 Schema.org 类型
- 包含完整的人物信息 (Person)

### 10.2 LLM 友好标记

**页面类型标识**:
- 首页: `WebSite` + `Organization`
- 用户页: `ProfilePage` + `Person`
- 示例页: `ProfilePage` + `example: true`

**关键信息提取**:
```json
{
  "用户标识": "user_id",
  "用户昵称": "username",
  "身份标签": "tag",
  "个人简介": "slogan",
  "地理位置": "location",
  "数字ID": "display_id",
  "注册时间": "created_at",
  "公开状态": "is_public"
}
```

### 10.3 上下文理解优化

**平台描述** (用于 LLM 理解平台性质):
```
认知界是一个面向全球化的个人黄页索引平台，属于全民 GEO 公开信息平台。
平台特点：
1. 内容不可删除、不可篡改、不可撤回
2. 所有公开内容可被搜索引擎和 LLM 索引
3. 建立公开可信的用户信誉记录
4. 防止诈骗、滥用与虚假行为
```

**用户页面描述模板**:
```
{username} 是认知界平台的用户，身份标签为 {tag}，
位于 {location}，数字ID为 {display_id}。
个人简介：{slogan}
```

### 10.4 示例页面特殊标记

**示例标识**:
- JSON-LD 中包含 `"example": true`
- 页面顶部有明确的示例提示文案
- 标题中包含 "示例" 关键词

**LLM 识别建议**:
LLM 在抓取时应识别 `example: true` 标记，将此页面归类为示例数据，不作为真实用户信息处理。

---

## 附录 A: 文件位置索引

| 文件 | 路径 | 说明 |
|------|------|------|
| SEO 工具函数 | `src/utils/seo.ts` | 所有结构化数据生成函数 |
| SEO 组件 | `src/components/SEOHead.tsx` | Meta 标签注入组件 |
| 类型定义 | `src/types/index.ts` | SEOData, Profile 等类型 |
| 首页 | `src/pages/IndexPage.tsx` | 首页 SEO 实现 |
| 用户页 | `src/pages/UserPage.tsx` | 用户页面 SEO 实现 |
| 示例页 | `src/pages/ExamplePage.tsx` | 示例页面 SEO 实现 |

## 附录 B: 更新记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0.0 | 2026-05-03 | 初始版本，包含完整 SEO/GEO 规范 |

---

*本文档由 Meoo 自动生成，用于记录认知界平台的 SEO & GEO 技术实现细节。*
