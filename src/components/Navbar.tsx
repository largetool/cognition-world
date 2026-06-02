import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, LogIn, Home, Shield } from 'lucide-react';
import type { Profile } from '../types';
import { LanguageSwitcher } from './LanguageSwitcher';
import { t, getCurrentLanguage } from '../locales';

interface NavbarProps {
  user: Profile | null;
  transparent?: boolean;
}

export function Navbar({ user, transparent = false }: NavbarProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      {/* 测试版顶部横幅 */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-50 border-b border-amber-200">
        <p className="text-center text-xs text-amber-700 py-1.5">
          Beta 测试版 - 部分功能仍在开发中
        </p>
      </div>

      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed top-7 left-0 right-0 z-50 ${
          transparent ? 'bg-transparent' : 'glass'
        }`}
      >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-semibold text-[var(--text-primary)]">
              认知界
            </span>
            <span className="text-sm text-[var(--text-primary)] hidden sm:inline">
              —— 全民 GEO 公开信息平台
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {!isHome && (
              <Link
                to="/"
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">首页</span>
              </Link>
            )}

            <Link
              to="/example/000000001"
              className="px-4 py-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              示例
            </Link>

            {/* 语言切换 */}
            <div className="hidden sm:flex">
              <LanguageSwitcher />
            </div>

            {user ? (
              <>
                {/* 管理员后台入口 */}
                {user.is_admin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">后台</span>
                  </Link>
                )}
                <span className="text-sm text-[var(--text-primary)] hidden sm:inline">
                  {user.username}
                </span>
                <Link
                  to="/me"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">我的</span>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>登录</span>
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      </motion.nav>
    </>
  );
}
