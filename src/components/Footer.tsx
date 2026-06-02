import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../types';
import { t, getCurrentLanguage } from '../locales';

export function Footer() {
  const linkClass = "text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors";

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="py-12 px-4 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]"
    >
      <div className="max-w-6xl mx-auto">
        {/* 三列链接 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {/* 产品 */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">产品</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/whitepaper" className={linkClass}>白皮书</Link>
              </li>
            </ul>
          </div>

          {/* 法律 */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">法律</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className={linkClass}>隐私政策</Link>
              </li>
              <li>
                <Link to="/terms" className={linkClass}>用户协议</Link>
              </li>
              <li>
                <Link to="/accessibility" className={linkClass}>无障碍声明</Link>
              </li>
            </ul>
          </div>

          {/* 了解更多 */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">了解更多</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className={linkClass}>关于我们</Link>
              </li>
              <li>
                <Link to="/contact" className={linkClass}>联系我们</Link>
              </li>
              <li>
                <Link to="/guestbook" className={linkClass}>留言板</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部版权信息 */}
        <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-tertiary)]">
              © 2026 {APP_CONFIG.name} {APP_CONFIG.nameEn}
            </span>
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">
            SEO Index: {APP_CONFIG.nameEn} | GEO Anchor: {APP_CONFIG.geoAnchor} | Time: {APP_CONFIG.timeAnchor} | Beta 测试版
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
