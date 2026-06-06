import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { loginWithEmail, getCurrentUser } from '../utils/auth';
import { supabase } from '../supabase/client';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { APP_CONFIG } from '../types';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';
import { t, getCurrentLanguage } from '../locales';

// 背景图
const heroBg = '/assets/C2283395-46CF-48E8-B1EC-3813518039AE.jpg';

type LoginType = 'email' | 'phone';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState<LoginType>('email');
  
  // 邮箱登录表单
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: ''
  });
  
  // 手机号登录表单
  const [phoneForm, setPhoneForm] = useState({
    phone: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (loginType === 'email') {
      const { session, error: loginError } = await loginWithEmail(emailForm.email, emailForm.password);

      if (loginError) {
        setError('邮箱或密码错误');
        setIsSubmitting(false);
        return;
      }

      if (session) {
        const { profile } = await getCurrentUser();
        if (profile) {
          navigate('/me');
        }
      }
    }
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'https://uptef.com/me' },
      });
      if (error) setError(error.message);
    } catch (err) {
      setError('Google 登录失败，请重试');
    }
  };

  const seoData = {
    title: '登录 - 认知界',
    description: '登录认知界，管理您的个人公开身份页面',
    canonicalUrl: `${APP_CONFIG.url}/login`,
    ogImage: `${APP_CONFIG.url}/og-image.png`,
    ogType: 'website' as const,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: '登录 - 认知界',
        description: '登录认知界，管理您的个人公开身份页面',
        url: `${APP_CONFIG.url}/login`,
      },
      generateBreadcrumbList([breadcrumbs.home, breadcrumbs.login]),
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead data={seoData} jsonLd={jsonLd} />

      <div className="min-h-screen flex flex-col">
        {/* 背景图（与首页风格一致） */}
        <div
          className="fixed inset-0 bg-cover bg-no-repeat will-change-transform"
          style={{
            backgroundImage: `url('${heroBg}')`,
            backgroundPosition: 'center 40%',
            filter: 'brightness(1.08) contrast(0.95) saturate(1.11)',
          }}
          role="img" aria-label="Hero background"
        />

        {/* 顶部导航 */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#18181B] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </button>
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 flex items-center justify-center pt-16 px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h1 className="text-2xl font-bold text-center text-[var(--text-primary)] mb-2">
                欢迎回来
              </h1>
              <p className="text-center text-[var(--text-secondary)] mb-6">
                登录您的认知界账户
              </p>

              {/* 登录类型切换 */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setLoginType('email')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    loginType === 'email'
                      ? 'bg-slate-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  邮箱登录
                </button>
                <button
                  onClick={() => setLoginType('phone')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    loginType === 'phone'
                      ? 'bg-slate-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  手机号登录
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {loginType === 'email' ? (
                    <motion.div
                      key="email"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                          邮箱地址
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={emailForm.email}
                            onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
                            placeholder="your@email.com"
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="phone"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                          手机号
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={phoneForm.phone}
                            onChange={(e) => setPhoneForm({ ...phoneForm, phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
                            placeholder="请输入手机号"
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginType === 'email' ? emailForm.password : phoneForm.password}
                      onChange={(e) => {
                        if (loginType === 'email') {
                          setEmailForm({ ...emailForm, password: e.target.value });
                        } else {
                          setPhoneForm({ ...phoneForm, password: e.target.value });
                        }
                      }}
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
                      placeholder="请输入密码"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400">或</span>
                  </div>
                </div>

                {/* Google 登录 */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3 px-4 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  使用 Google 登录
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    '登录'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-slate-600 hover:underline"
                >
                  忘记密码？
                </button>
              </div>

              <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
                还没有账户？
                <button
                  onClick={() => navigate('/register')}
                  className="text-slate-600 hover:underline font-medium"
                >
                  立即注册
                </button>
              </div>
            </div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
