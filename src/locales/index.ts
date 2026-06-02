import en from './en.json';
import zh from './zh.json';

export type Language = 'zh' | 'en';

export const messages = {
  en,
  zh
};

export function changeLanguage(lang: Language): void {
  localStorage.setItem('language', lang);
  window.location.reload();
}

export function getCurrentLanguage(): Language {
  const saved = localStorage.getItem('language') as Language;
  if (saved && (saved === 'zh' || saved === 'en')) {
    return saved;
  }
  // 检测浏览器语言
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('en')) {
    return 'en';
  }
  return 'zh';
}

export function getMessages(lang: Language) {
  return messages[lang] || messages.zh;
}

// 翻译函数
export function t(key: string, lang: Language = getCurrentLanguage()): string {
  const msgs = getMessages(lang);
  const keys = key.split('.');
  let value: any = msgs;
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return key;
  }
  return typeof value === 'string' ? value : key;
}
