import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'cognition_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consented = localStorage.getItem(STORAGE_KEY);
    if (!consented) {
      // 延迟弹出，不干扰首屏体验
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 pointer-events-none"
        >
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/90 shadow-2xl shadow-slate-200/60 p-5 sm:p-6">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0">
                  <Cookie className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">
                    Cookie 声明
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    本站使用必要的 Cookie 来维持登录状态和基本功能，不收集个人隐私数据，不投放广告追踪。
                    继续使用即表示你同意此设置。
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <a
                  href="/privacy"
                  className="text-xs text-gray-400 hover:text-indigo-600 transition-colors underline underline-offset-2"
                  onClick={handleDismiss}
                >
                  隐私政策
                </a>
                <button
                  onClick={handleAccept}
                  className="px-5 py-2 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200/50"
                >
                  我知道了
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
