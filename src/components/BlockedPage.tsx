import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlockedPageProps {
  ip?: string;
}

export function BlockedPage({ ip }: BlockedPageProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="mb-6">
          <AlertTriangle className="w-16 h-16 text-white/40 mx-auto" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-4">
          访问受限
        </h1>
        <p className="text-white/60 mb-2">
          您的IP地址已被列入黑名单
        </p>
        {ip && (
          <p className="text-white/40 text-sm mb-8 font-mono">
            {ip}
          </p>
        )}
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          返回首页
        </Link>
      </motion.div>
    </div>
  );
}
