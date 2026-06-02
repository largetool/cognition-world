import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="rounded-xl p-3 sm:p-6 group cursor-pointer"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="flex items-center justify-center mb-2 sm:mb-4">
        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
          <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-[#222] group-hover:text-white transition-colors" />
        </div>
      </div>
      <h3 className="text-xs sm:text-lg font-semibold text-[#1a1a1a] mb-1 sm:mb-2 text-center" style={{ fontWeight: 600 }}>
        {title}
      </h3>
      <p className="text-[10px] sm:text-sm text-[#6b7280] text-center leading-tight">
        {description}
      </p>
    </motion.div>
  );
}
