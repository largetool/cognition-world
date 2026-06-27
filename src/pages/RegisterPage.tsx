import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react';

import { supabase } from '../supabase/client';
import { APP_CONFIG } from '../types';
import { SEOHead } from '../components/SEOHead';
import { generateWebPageSchema, generateBreadcrumbList, breadcrumbs } from '../utils/seo';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    tag: '',
    slogan: '',
    country: '',
    province: '',
    city: '',
    community: '',
    phone: '',
    isPublic: true,
    agreeTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Google OAuth 注册模式
  const location = useLocation();
  const isGoogleMode = new URLSearchParams(location.search).get('from') === 'google';
  const [googleUserLoading, setGoogleUserLoading] = useState(isGoogleMode);
  const [googleUser, setGoogleUser] = useState<any>(null);




  // Google OAuth 模式：加载用户信息并预填表单
  useEffect(() => {
    if (!isGoogleMode) return;
    const loadGoogleUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setGoogleUser(user);
        const name = user.user_metadata?.full_name ||
                     user.user_metadata?.name ||
                     (user.email ? user.email.split('@')[0] : '');
        setFormData(prev => ({
          ...prev,
          username: name,
          email: user.email || '',
          password: '',
          confirmPassword: '',
        }));
      } else {
        // Google 会话已过期，跳回登录页
        navigate('/login');
      }
      setGoogleUserLoading(false);
    };
    loadGoogleUser();
  }, [isGoogleMode]);




  if (registered) {
    return (
      <div className="min-h-screen text-[#18181B]" style={{ backgroundImage: 'url(/assets/C2283395-46CF-48E8-B1EC-3813518039AE.jpg)', backgroundRepeat: 'repeat', backgroundSize: 'auto', backgroundPosition: 'top center', backgroundColor: '#FAFAFA' }}>
        <SEOHead
          data={{
            title: `注册成功 - ${APP_CONFIG.name}`,
            description: '您的数字身份已创建成功，现在可以登录使用一言超人的全部功能。',
            canonicalUrl: `${APP_CONFIG.url}/register`,
            ogImage: `${APP_CONFIG.url}/og-image.jpg`,
          }}
          jsonLd={{
            '@context': 'https://schema.org',
            '@graph': [
              generateWebPageSchema('注册成功', `${APP_CONFIG.url}/register`, '您的数字身份已创建成功'),
              generateBreadcrumbList([breadcrumbs.home, breadcrumbs.register]),
            ],
          }}
        />
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#18181B] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
          </div>
        </header>

        <main className="pt-20 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-6">
          <div className="max-w-xl mx-auto">
            <motion.div
              className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">注册成功</h1>
              <p className="text-gray-500 mb-8">您的数字身份已创建</p>
              {!isGoogleMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-amber-800 font-medium mb-1">⚠️ 需要确认邮箱才能登录</p>
                  <p className="text-sm text-amber-700">
                    已向您的注册邮箱发送了一封确认邮件。请去邮箱点击确认链接，然后才能登录。
                    <br />没收到？检查垃圾邮件箱。
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-600 mb-6">
                {isGoogleMode ? '您的个人资料已创建，现在可以开始使用' : '确认邮箱后即可登录'}
              </p>
              <motion.button
                onClick={() => navigate(isGoogleMode ? '/me' : '/login')}
                className="w-full px-6 py-3 bg-[#18181B] text-white rounded-lg hover:bg-[#27272A] transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isGoogleMode ? '进入我的页面' : '去登录'}
              </motion.button>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#18181B]" style={{ backgroundImage: 'url(/assets/C2283395-46CF-48E8-B1EC-3813518039AE.jpg)', backgroundRepeat: 'repeat', backgroundSize: 'auto', backgroundPosition: 'top center', backgroundColor: '#FAFAFA' }}>
      <SEOHead
        data={{
          title: `创建数字身份 - ${APP_CONFIG.name}`,
          description: '在一言超人创建您的数字身份，加入认知界，记录和分享您的思考与见解。',
          canonicalUrl: `${APP_CONFIG.url}/register`,
          ogImage: `${APP_CONFIG.url}/og-image.jpg`,
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            generateWebPageSchema('创建数字身份', `${APP_CONFIG.url}/register`, '在一言超人创建您的数字身份，加入认知界'),
            generateBreadcrumbList([breadcrumbs.home, breadcrumbs.register]),
          ],
        }}
      />
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#18181B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
        </div>
      </header>

      <main className="pt-20 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-xl mx-auto">
          <motion.div
            className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-10 shadow-sm text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-slate-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">注册暂未开放</h1>
            <p className="text-gray-500 mb-6 leading-relaxed">
              认知界目前处于样板展示阶段，暂不开放新用户注册。
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3 mb-6">
              <p className="text-sm text-slate-700">
                <strong>如需合作，请联系：</strong>
              </p>
              <p className="text-sm text-slate-600">
                如果您是投资机构或合规合作伙伴，欢迎通过以下方式与我们取得联系：
              </p>
              <div className="text-sm text-slate-600 space-y-1">
                <p>📧 邮箱：<span className="text-blue-600">contact@uptef.com</span></p>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                您仍可以浏览网站的公开页面，了解认知界的理念与功能。
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full px-6 py-3 bg-[#18181B] text-white rounded-lg hover:bg-[#27272A] transition-colors text-sm font-medium"
              >
                已有账户？登录
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full px-6 py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                返回首页
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
