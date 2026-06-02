import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { getCurrentLanguage, changeLanguage, type Language } from '../locales';

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<Language>(getCurrentLanguage());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 根据路径检测语言
    const path = location.pathname;
    if (path.startsWith('/en')) {
      setCurrentLang('en');
    } else {
      setCurrentLang('zh');
    }
  }, [location.pathname]);

  const switchLanguage = (lang: Language) => {
    if (lang === currentLang) return;

    const currentPath = location.pathname;
    let newPath: string;

    if (lang === 'en') {
      // 切换到英文
      if (currentPath === '/') {
        newPath = '/en';
      } else if (currentPath.startsWith('/en')) {
        newPath = currentPath;
      } else {
        newPath = '/en' + currentPath;
      }
    } else {
      // 切换到中文
      if (currentPath === '/en') {
        newPath = '/';
      } else if (currentPath.startsWith('/en/')) {
        newPath = currentPath.replace('/en', '');
      } else {
        newPath = currentPath;
      }
    }

    // 保存语言偏好
    localStorage.setItem('language', lang);
    // 导航到新路径
    navigate(newPath);
  };

  return (
    <div className="flex items-center gap-1">
      <Globe className="w-4 h-4 text-[var(--text-secondary)]" />
      <button
        onClick={() => switchLanguage('zh')}
        className={`px-2 py-1 text-sm rounded transition-colors ${
          currentLang === 'zh'
            ? 'bg-[var(--accent)] text-white'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        title="中文"
      >
        中
      </button>
      <span className="text-[var(--text-tertiary)]">|</span>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-2 py-1 text-sm rounded transition-colors ${
          currentLang === 'en'
            ? 'bg-[var(--accent)] text-white'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        title="English"
      >
        EN
      </button>
    </div>
  );
}
