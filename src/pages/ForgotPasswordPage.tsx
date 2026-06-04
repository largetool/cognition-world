import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { GlassCard } from '../components/GlassCard';
import { getDefaultSEO } from '../types';
import { supabaseUrl } from '../supabase/client';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('请输入邮箱地址');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 调用 Edge Function：后端验证邮箱、生成令牌、保存到DB、发送邮件
      const response = await fetch(`${supabaseUrl}/functions/v1/resend-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          type: 'password-reset',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '发送失败，请重试');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('发送失败，请重试');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead
        data={{ ...getDefaultSEO(), title: '找回密码 - 认知界' }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            generateBreadcrumbList([breadcrumbs.home, breadcrumbs.forgotPassword]),
          ],
        }}
      />
      <Navbar user={null} />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                找回密码
              </h1>
              <p className="text-[var(--text-secondary)]">
                {success ? '重置链接已发送' : '输入注册邮箱获取重置链接'}
              </p>
            </div>

            <GlassCard>
              {error && (
                <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    重置链接已发送
                  </h3>
                  <p className="text-[var(--text-secondary)] mb-2">
                    请检查邮箱 {email}
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    链接有效期1小时，只能使用一次
                  </p>
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => {
                        setSuccess(false);
                        setEmail('');
                      }}
                      className="w-full py-3 rounded-lg border border-[var(--border-light)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      重新发送
                    </button>
                    <Link
                      to="/login"
                      className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      返回登录
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      注册邮箱
                    </label>
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="请输入注册时使用的邮箱"
                        className="input-field"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      我们将向此邮箱发送密码重置链接
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                  >
                    <span>{isLoading ? '发送中...' : '发送重置链接'}</span>
                    {!isLoading && <ChevronRight className="w-4 h-4" />}
                  </motion.button>

                  <div className="mt-6 text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      返回登录
                    </Link>
                  </div>
                </form>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
