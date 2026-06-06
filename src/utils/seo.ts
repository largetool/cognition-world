import type { SEOData, Profile } from '../types';
import { APP_CONFIG, userProfileWebUrl, fmtDisplayId } from '../types';

const BASE_URL = 'https://uptef.com';

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '面向全球化的个人黄页索引',
    alternateName: '全民 GEO 公开信息平台',
    url: APP_CONFIG.url,
    description: '一个公开、可验证、不可删除的个人 GEO 信息平台。',
    inLanguage: 'zh-CN',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${APP_CONFIG.url}/search?q={search_term_string}`,
    },
  };
}

export function generateOrganizationSchema() {
  return {
    '@type': 'Organization',
    name: APP_CONFIG.name,
    url: APP_CONFIG.url,
    description: APP_CONFIG.description,
  };
}

export function generatePersonSchema(profile: Profile, aiDescription?: string) {
  return {
    '@type': 'Person',
    '@id': profile.user_id,
    name: profile.username,
    alternateName: profile.user_id,
    jobTitle: profile.tag,
    description: aiDescription || profile.slogan,
    identifier: {
      '@type': 'PropertyValue',
      name: 'display_id',
      value: fmtDisplayId(profile.display_id),
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile.location,
    },
    url: userProfileWebUrl(profile.display_id),
    sameAs: [],
  };
}

export function generateBlogPostingSchema(log: { content: string; created_at: string }, profile: Profile) {
  return {
    '@type': 'BlogPosting',
    headline: log.content.slice(0, 60),
    articleBody: log.content,
    author: {
      '@type': 'Person',
      name: profile.username,
    },
    datePublished: log.created_at,
  };
}

export function generateProfilePageSchema(profile: Profile, aiDescription?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${profile.username} - ${APP_CONFIG.name}`,
    description: aiDescription || profile.slogan || `${profile.tag} | ${APP_CONFIG.name}`,
    url: userProfileWebUrl(profile.display_id),
    inLanguage: 'zh-CN',
    dateModified: profile.updated_at,
    mainEntity: generatePersonSchema(profile, aiDescription),
  };
}

export function generateWebPageSchema(name: string, url: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    url,
    description,
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: APP_CONFIG.name,
      url: APP_CONFIG.url,
    },
  };
}

export function getDefaultSEO(): SEOData {
  return {
    title: '面向全球化的个人黄页索引｜全民 GEO 公开信息平台',
    description: APP_CONFIG.description,
    keywords: ['个人主页', '黄页', 'AI', '认知', '索引', 'GEO', '全民 GEO', 'Cognition World'],
    ogType: 'website',
    canonicalUrl: APP_CONFIG.url,
  };
}

/**
 * 获取用户页面的 SEO 数据 - 安全降级版本
 * 修复：当 profile 字段缺失时提供默认值
 */
export function getUserSEO(profile: Profile | null | undefined): SEOData {
  if (!profile) {
    return getDefaultSEO();
  }

  const username = profile.username || '用户';
  const userId = profile.user_id || '';
  const tag = profile.tag || '';
  const slogan = profile.slogan || `${tag} | ${APP_CONFIG.name}`;

  return {
    title: `${username} - ${APP_CONFIG.name}`,
    description: slogan,
    keywords: [username, tag, userId, '个人主页'],
    ogType: 'profile',
    canonicalUrl: userProfileWebUrl(profile.display_id),
  };
}

// BreadcrumbList 结构化数据生成函数
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbList(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// FAQPage 结构化数据
export interface FAQItem {
  q: string;
  a: string;
}

export function generateFAQPageSchema(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

// 预定义的面包屑路径
export const breadcrumbs = {
  home: { name: '认知界', url: APP_CONFIG.url },
  register: { name: '注册', url: `${APP_CONFIG.url}/register` },
  login: { name: '登录', url: `${APP_CONFIG.url}/login` },
  whitepaper: { name: '白皮书', url: `${APP_CONFIG.url}/whitepaper` },
  terms: { name: '用户协议', url: `${APP_CONFIG.url}/terms` },
  privacy: { name: '隐私政策', url: `${APP_CONFIG.url}/privacy` },
  about: { name: '关于我们', url: `${APP_CONFIG.url}/about` },
  contact: { name: '联系我们', url: `${APP_CONFIG.url}/contact` },
  accessibility: { name: '无障碍声明', url: `${APP_CONFIG.url}/accessibility` },
  guestbook: { name: '留言板', url: `${APP_CONFIG.url}/guestbook` },
  me: { name: '个人中心', url: `${APP_CONFIG.url}/me` },
  messages: { name: '消息', url: `${APP_CONFIG.url}/messages` },
  admin: { name: '管理后台', url: `${APP_CONFIG.url}/admin` },
  forgotPassword: { name: '忘记密码', url: `${APP_CONFIG.url}/forgot-password` },
  resetPassword: { name: '重置密码', url: `${APP_CONFIG.url}/reset-password` },
  thought: (username: string, displayId: number | null, thoughtId: string) => ({
    name: '动态',
    url: `${APP_CONFIG.url}/${fmtDisplayId(displayId)}/thought/${thoughtId}`,
  }),
  user: (username: string, displayId: number | null) => ({
    name: username,
    url: userProfileWebUrl(displayId),
  }),
};
