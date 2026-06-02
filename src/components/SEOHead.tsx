import { useEffect } from 'react';
import type { SEOData } from '../types';
import { getCurrentLanguage, type Language } from '../locales';
import { APP_CONFIG } from '../types';

interface SEOHeadProps {
  data?: SEOData;
  jsonLd?: object | object[];
}

const DEFAULT_TITLE = '认知界 - 让AI认识每一个具体的普通人';
const DEFAULT_DESCRIPTION = '面向全球化的个人黄页索引，让 AI 认识每一个具体的普通人';
const DEFAULT_OG_IMAGE = 'https://placehold.co/1200x630/1a1a2e/e6e6e6?text=%E8%AE%A4%E7%9F%A5%E7%95%8C+Cognition+World&font=raleway';

/**
 * SEOHead 组件 - 安全降级版本
 * 修复：Cannot read properties of undefined (reading 'title')
 * 策略：data 为可选参数，所有字段使用安全访问和默认值
 */
export function SEOHead({ data, jsonLd }: SEOHeadProps) {
  useEffect(() => {
    try {
      // 安全降级：确保 data 存在且字段有效
      const safeTitle = data?.title || DEFAULT_TITLE;
      const safeDescription = data?.description || DEFAULT_DESCRIPTION;
      const safeKeywords = data?.keywords?.join(', ') || '';
      const safeOgType = data?.ogType || 'website';
      const safeOgImage = data?.ogImage || DEFAULT_OG_IMAGE;
      const safeCanonicalUrl = data?.canonicalUrl || '';

      // 记录 SEO 渲染事件（用于监控）
      if (window.location.hostname.includes('staging') || window.location.hostname === 'localhost') {
        // eslint-disable-next-line no-console
        console.info('[SEOHead] Rendered:', { title: safeTitle, hasData: !!data });
      }

      // 设置页面标题
      document.title = safeTitle;

      // 定义 meta 标签
      const metaTags = [
        { name: 'description', content: safeDescription },
        { name: 'keywords', content: safeKeywords },
        { property: 'og:title', content: safeTitle },
        { property: 'og:description', content: safeDescription },
        { property: 'og:type', content: safeOgType },
        { property: 'og:image', content: safeOgImage },
        { property: 'og:url', content: safeCanonicalUrl },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: safeTitle },
        { name: 'twitter:description', content: safeDescription },
        { name: 'twitter:image', content: safeOgImage },
      ];

      // 更新或创建 meta 标签
      metaTags.forEach(tag => {
        if (!tag.content) return;

        let element: HTMLMetaElement | null = null;

        if (tag.name) {
          element = document.querySelector(`meta[name="${tag.name}"]`);
          if (!element) {
            element = document.createElement('meta');
            element.setAttribute('name', tag.name);
            document.head.appendChild(element);
          }
        } else if (tag.property) {
          element = document.querySelector(`meta[property="${tag.property}"]`);
          if (!element) {
            element = document.createElement('meta');
            element.setAttribute('property', tag.property);
            document.head.appendChild(element);
          }
        }

        if (element) {
          element.setAttribute('content', tag.content);
        }
      });

      // 更新 canonical URL
      if (safeCanonicalUrl) {
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!canonical) {
          canonical = document.createElement('link');
          canonical.setAttribute('rel', 'canonical');
          document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', safeCanonicalUrl);
      }

      // 添加 hreflang 标签
      const currentLang = getCurrentLanguage();
      const path = window.location.pathname;
      const isEnPath = path.startsWith('/en');
      const basePath = isEnPath ? path.replace('/en', '') || '/' : path;

      // 移除现有的 hreflang 标签
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

      // 添加中文版本
      const zhLink = document.createElement('link');
      zhLink.setAttribute('rel', 'alternate');
      zhLink.setAttribute('hreflang', 'zh-CN');
      zhLink.setAttribute('href', `${APP_CONFIG.url}${basePath}`);
      document.head.appendChild(zhLink);

      // 添加英文版本
      const enLink = document.createElement('link');
      enLink.setAttribute('rel', 'alternate');
      enLink.setAttribute('hreflang', 'en');
      enLink.setAttribute('href', `${APP_CONFIG.url}/en${basePath === '/' ? '' : basePath}`);
      document.head.appendChild(enLink);

      // 添加 x-default
      const defaultLink = document.createElement('link');
      defaultLink.setAttribute('rel', 'alternate');
      defaultLink.setAttribute('hreflang', 'x-default');
      defaultLink.setAttribute('href', `${APP_CONFIG.url}${basePath}`);
      document.head.appendChild(defaultLink);

      // 更新 html lang 属性
      document.documentElement.setAttribute('lang', currentLang === 'en' ? 'en' : 'zh-CN');

      // 更新 JSON-LD 结构化数据
      if (jsonLd) {
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript) {
          existingScript.remove();
        }
        const script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(script);
      }
    } catch (error) {
      // 捕获异常，避免页面崩溃
      // eslint-disable-next-line no-console
      console.error('[SEOHead] Error:', error);
    }
  }, [data, jsonLd]);

  return null;
}
