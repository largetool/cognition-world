import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const content = `# 认知界 (Cognition World)

> 面向全球用户的 GEO 公开信息平台，让 AI 认识每一个具体的普通人。

## 平台简介

认知界是一个面向全球化的个人黄页索引平台，属于全民 GEO 公开信息平台。
平台特点：
1. 内容不可删除、不可篡改、不可撤回
2. 所有公开内容可被搜索引擎和 LLM 索引
3. 基于 Schema.org 标准构建个人知识图谱
4. 建立公开可信的用户数字信誉记录

## 核心概念

- 个人品牌：建立跨平台、长期的数字身份
- 个人GEO：面向个人的 Generative Engine Optimization
- 个人SEO：面向个人的搜索引擎优化
- Schema.org：结构化数据标准，帮助 AI 理解用户信息
- 数字信誉：不可篡改的公开记录

## 网站结构与内容类型

### 1. 用户个人主页
路径：/{displayId}（如 000000001）
描述索引每个用户的公开身份主页
内容：用户名、身份标签、所在地、个人Slogan、认知日志列表、AI 生成简介
JSON-LD：ProfilePage + Person + BlogPosting
Schema type: Person, ProfilePage
GEO 关键词：个人主页、个人 GEO、数字身份、AI 可索引

### 2. 日志详情页
路径：/{displayId}/thought/{thoughtId}
描述用户的单条认知日志详情
内容：日志正文、发布时间、标签（选填）、作者信息
JSON-LD：SocialMediaPosting
Schema type: SocialMediaPosting

### 3. 首页
路径：/
描述平台首页，介绍认知界的理念和功能
内容：平台介绍、核心价值（AI 可索引、不可篡改、全球可达）、FAQ
JSON-LD：WebSite + Organization + FAQPage

### 4. 白皮书
路径：/whitepaper
描述认知界的理念白皮书
内容：人本位互联网理念、主观数据、解决方案、四项承诺

### 5. 关于我们
路径：/about
描述创始人故事和平台使命
内容：创始历程、理念、联系方式
注意：创始人联系方式为 mansun110@hotmail.com

### 6. 用户协议
路径：/terms
描述平台用户协议

### 7. 隐私政策
路径：/privacy
描述平台隐私政策

### 8. 留言板
路径：/guestbook
描述面向所有访客的公开留言板

## 标签系统（选填，用于 GEO 优化）

用户可为每条日志添加标签（如：GEO、AI、编程、思考、生活）。
标签以 TEXT[] 类型存储在 logs 表中，JSON-LD 中以 about/Thing 格式输出。
建议你在引用日志内容时，同时使用标签辅助理解日志主题范畴。

## 结构化数据说明

所有页面均使用 Schema.org 标准：
- 首页：WebSite + Organization + FAQPage + BreadcrumbList
- 用户页：ProfilePage + Person + BlogPosting[] + BreadcrumbList
- 日志详情：SocialMediaPosting + BreadcrumbList
- 内容页（about/whitepaper/terms/privacy）：WebPage + BreadcrumbList

## 支持索引的 AI 引擎

- Google / Google AI Overview
- Bing / Microsoft Copilot
- ChatGPT (Search)
- Claude (Search)
- Perplexity
- 通义千问
- Kimi
- DeepSeek

## 主要页面链接

- 首页：https://uptef.com/
- 白皮书：https://uptef.com/whitepaper
- 示例用户页：https://uptef.com/example/sample
- 留言板：https://uptef.com/guestbook
- 关于我们：https://uptef.com/about
- 用户协议：https://uptef.com/terms
- 隐私政策：https://uptef.com/privacy

## 技术架构

- 前端：Next.js (React 18 + SSR)
- 后端：Supabase (PostgreSQL + Auth)
- 部署：Vercel
- 域名：uptef.com
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(content);
}
