import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Home, Compass, Plus, MessageCircle, User } from 'lucide-react';
import { getUnreadNotificationCount } from '../utils/storage';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    getUnreadNotificationCount().then(setNotifCount);
    // 每 30 秒刷新一次
    const interval = setInterval(() => {
      getUnreadNotificationCount().then(setNotifCount);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // 进入消息页面时重新获取（小红点可能已清零）
  useEffect(() => {
    if (location.pathname === '/messages') {
      getUnreadNotificationCount().then(setNotifCount);
    }
  }, [location.pathname]);

  const navItems = [
    { icon: Home, label: '首页', path: '/' },
    { icon: Compass, label: '发现', path: '/discover' },
    { icon: null, label: '发布', path: '/publish', isCenter: true },
    { icon: MessageCircle, label: '消息', path: '/messages', count: notifCount },
    { icon: User, label: '我的', path: '/me' },
  ];

  const isActive = (path: string) => {
    if (path === '/me') {
      return location.pathname === '/me';
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-200/50 safe-area-pb">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          if (item.isCenter) {
            return (
              <motion.button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="relative -top-3 w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-7 h-7 text-white" />
              </motion.button>
            );
          }

          const Icon = item.icon!;
          const active = isActive(item.path);

          return (
            <motion.button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors relative ${
                active ? 'text-amber-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {/* 未读消息数量标记 */}
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
