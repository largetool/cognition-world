import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { loginWithEmail, getCurrentUser } from '../utils/auth';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { APP_CONFIG } from '../types';
import { generateBreadcrumbList, breadcrumbs } from '../utils/seo';
import { t, getCurrentLanguage } from '../locales';
import heroBg from '../../assets/C2283395-46CF-48E8-B1EC-3813518039AE.jpg';

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
      {/* 背景图 */}
      <div
        className="fixed inset-0 bg-cover bg-no-repeat will-change-transform"
        style={{
          backgroundImage: `url('${heroBg}')`,
          backgroundPosition: 'center 40%',
          filter: 'brightness(1.08) contrast(0.95) saturate(1.11)',
        }}
        role="img" aria-label="Hero background"
      />

      <SEOHead data={seoData} jsonLd={jsonLd} />

      <div className="relative z-10 min-h-screen flex flex-col">
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
        <main className="flex-1 flex items-center justify-center pt-16 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-8">
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
