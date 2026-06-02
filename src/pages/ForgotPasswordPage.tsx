import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { GlassCard } from '../components/GlassCard';
import { getDefaultSEO } from '../types';
import { supabase, supabaseUrl } from '../supabase/client';
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
      // 1. 首先检查邮箱是否存在于系统中
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id, email')
        .eq('email', email)
        .maybeSingle();

      if (profileError || !profile) {
        setError('该邮箱未注册，请检查邮箱地址');
        setIsLoading(false);
        return;
      }

      // 2. 生成密码重置令牌
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1小时后过期

      // 3. 保存重置令牌到数据库
      const { error: tokenError } = await supabase
        .from('password_resets')
        .insert({
          user_id: profile.id,  // 使用 uuid 类型的 id，不是 user_id
          email: email,
          token: resetToken,
          expires_at: expiresAt,
        });

      if (tokenError) {
        console.error('保存重置令牌失败:', tokenError);
        setError('生成重置链接失败: ' + tokenError.message);
        setIsLoading(false);
        return;
      }

      // 4. 构建重置链接
      const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;

      // 5. 调用 Edge Function 发送邮件
      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: '密码重置 - 认知界',
          type: 'password-reset',
          resetUrl: resetUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Send email error:', result);
        setError(result.error || '发送邮件失败，请重试');
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
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="请输入注册时使用的邮箱"
                        className="input-field pl-10"
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
