import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { GlassCard } from '../components/GlassCard';
import { getDefaultSEO } from '../types';
import { supabaseUrl } from '../supabase/client';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  // 通过 Edge Function 检查重置令牌是否有效
  useEffect(() => {
    const checkToken = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setIsValidLink(false);
        setIsValidating(false);
        setError('重置链接无效，请重新申请');
        return;
      }

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'validate' }),
        });

        const result = await response.json();

        if (response.ok && result.valid) {
          setIsValidLink(true);
        } else {
          setIsValidLink(false);
          setError(result.error || '重置链接无效，请重新申请');
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setIsValidLink(false);
        setError('网络错误，请重试');
      } finally {
        setIsValidating(false);
      }
    };
    checkToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setError('请填写新密码');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = searchParams.get('token');
      if (!token) {
        setError('重置链接无效');
        setIsLoading(false);
        return;
      }

      // 调用 Edge Function 重置密码
      const response = await fetch(`${supabaseUrl}/functions/v1/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, action: 'reset' }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '重置失败，请重试');
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('重置失败，请重试');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead data={{ ...getDefaultSEO(), title: '重置密码 - 认知界' }} />
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
                重置密码
              </h1>
              <p className="text-[var(--text-secondary)]">
                {success ? '密码重置成功' : '设置您的新密码'}
              </p>
            </div>

            <GlassCard>
              {error && (
                <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {isValidating ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 mx-auto mb-4 rounded-full animate-spin" style={{ border: '3px solid var(--accent)', borderTopColor: 'transparent' }} />
                  <p className="text-[var(--text-secondary)]">正在验证重置链接...</p>
                </div>
              ) : success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    密码重置成功
                  </h3>
                  <p className="text-[var(--text-secondary)] mb-6">
                    请使用新密码登录，3秒后自动跳转...
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-6 py-3 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    去登录
                  </Link>
                </div>
              ) : !isValidLink ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    链接无效
                  </h3>
                  <p className="text-[var(--text-secondary)] mb-6">
                    重置链接已过期或已被使用
                  </p>
                  <Link
                    to="/forgot-password"
                    className="inline-flex items-center px-6 py-3 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    重新申请
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      新密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="至少6位字符"
                        className="input-field pl-10"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      确认密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次输入新密码"
                        className="input-field pl-10"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                  >
                    <span>{isLoading ? '重置中...' : '重置密码'}</span>
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
