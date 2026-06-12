import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Tag, MapPin, MessageSquare, Globe, Check, Mail, Lock, Eye, EyeOff, CheckCircle, Phone } from 'lucide-react';
import { registerWithEmail, checkEmailExists, getNextDisplayId } from '../utils/auth';
import { supabase } from '../supabase/client';
import { generateUserId, APP_CONFIG } from '../types';
import { SEOHead } from '../components/SEOHead';
import { generateWebPageSchema, generateBreadcrumbList, breadcrumbs } from '../utils/seo';
import { t, getCurrentLanguage } from '../locales';

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

  // 验证邮箱格式
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 检查邮箱唯一性
  const checkEmailUnique = async (email: string) => {
    if (!validateEmail(email)) {
      setEmailError('请输入正确的邮箱格式');
      return false;
    }
    const exists = await checkEmailExists(email);
    if (exists) {
      setEmailError('该邮箱已被注册');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailBlur = async () => {
    if (formData.email) {
      await checkEmailUnique(formData.email);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Google OAuth 新用户：已完成认证，直接创建 profile
    if (isGoogleMode && googleUser) {
      if (!formData.username || !formData.tag) {
        setError('请至少填写用户名和身份标签');
        return;
      }
      if (!formData.country || !formData.province || !formData.city) {
        setError('请完整填写所在地信息（国家、省/市、城市）');
        return;
      }
      if (!formData.agreeTerms) {
        setError('请同意服务条款');
        return;
      }
      setIsSubmitting(true);
      const locationStr = formData.community
        ? `${formData.country} ${formData.province} ${formData.city} ${formData.community}`
        : `${formData.country} ${formData.province} ${formData.city}`;
      const nextId = await getNextDisplayId();
      const userId = generateUserId(formData.username, nextId);
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: googleUser.id,
          username: formData.username,
          user_id: userId,
          email: googleUser.email || formData.email,
          tag: formData.tag,
          slogan: formData.slogan || null,
          slogan_approved: formData.slogan ? false : null,
          location: locationStr,
          is_public: formData.isPublic,
          is_hidden: false,
          is_admin: false,
          display_id: nextId,
          onboarding_completed: false,
          account_status: 'available',
          geo_enabled: false,
        });
      if (insertError) {
        setError('创建资料失败：' + (insertError.message || '请重试'));
        setIsSubmitting(false);
        return;
      }
      setRegistered(true);
      setIsSubmitting(false);
      return;
    }

    // 验证邮箱
    if (!validateEmail(formData.email)) {
      setError('请输入正确的邮箱格式');
      return;
    }

    // 检查邮箱唯一性
    const isUnique = await checkEmailUnique(formData.email);
    if (!isUnique) {
      setError(emailError || '邮箱验证失败');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    if (!formData.agreeTerms) {
      setError('请同意服务条款才能注册');
      return;
    }

    // 验证所在地必填项
    if (!formData.country || !formData.province || !formData.city) {
      setError('请完整填写所在地信息（国家、省/市、城市）');
      return;
    }

    setIsSubmitting(true);

    // 构建所在地字符串
    const locationString = formData.community
      ? `${formData.country} ${formData.province} ${formData.city} ${formData.community}`
      : `${formData.country} ${formData.province} ${formData.city}`;

    const nextId = await getNextDisplayId();
    const userId = generateUserId(formData.username, nextId);
    const { user, error: registerError } = await registerWithEmail(
      formData.email,
      formData.password,
      {
        username: formData.username,
        user_id: userId,
        tag: formData.tag,
        slogan: formData.slogan,
        location: locationString,
        is_public: formData.isPublic,
        phone: formData.phone || undefined
      }
    );

    if (registerError) {
      setError(registerError.message || '注册失败，请重试');
      setIsSubmitting(false);
      return;
    }

    if (user) {
      // 注册成功后，自动创建 profiles 记录
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: formData.username,
          user_id: userId,
          email: formData.email,
          tag: formData.tag,
          slogan: formData.slogan || null,
          slogan_approved: formData.slogan ? false : null,
          location: locationString,
          is_public: formData.isPublic,
          is_hidden: false,
          is_admin: false,
          display_id: nextId,
          onboarding_completed: false,
          account_status: 'available',
          geo_enabled: false
        });

      if (profileError) {
        console.error('创建用户资料失败:', profileError);
        // 即使创建资料失败，也允许用户继续，只是资料可能不完整
      }

      setRegistered(true);
    } else {
      setError('注册失败，请重试');
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => {
    navigate('/login');
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://uptef.com/me',
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) setError(error.message);
    } catch (err) {
      setError('Google 登录失败，请重试');
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#18181B]">
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
              <p className="text-sm text-gray-600 mb-6">
                {isGoogleMode ? '您的个人资料已创建，现在可以开始使用' : '现在您可以使用邮箱和密码登录了'}
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
    <div className="min-h-screen bg-[#FAFAFA] text-[#18181B]">
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
            className="text-center mb-8 sm:mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">
              {isGoogleMode ? '完善你的个人资料' : '创建你的数字身份'}
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              {isGoogleMode ? 'Google 账号登录成功，补充以下信息完成注册' : '使用邮箱创建数字身份'}
            </p>
          </motion.div>

          {/* 测试版通知 */}
          <motion.div
            className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Beta 测试版重要提示</p>
                <p>当前为功能测试阶段，数据可能会被重置或删除。请勿存储重要信息，正式版上线后需重新注册。</p>
                <p className="mt-2 text-amber-700 font-medium">💡 建议使用您在其他平台常用的昵称，保持全网身份统一</p>
              </div>
            </div>
          </motion.div>

          {isGoogleMode && googleUserLoading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 mx-auto border-2 border-gray-200 border-t-[#18181B] rounded-full animate-spin" />
              <p className="text-gray-500 text-sm mt-4">正在验证 Google 登录...</p>
            </div>
          ) : (
          <motion.form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="space-y-5 sm:space-y-6">
              {/* Google 一键注册 — 仅普通模式显示 */}
              {!isGoogleMode && (
                <>
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
                    使用 Google 快速注册
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-gray-400">或填写以下信息</span>
                    </div>
                  </div>
                </>
              )}

              {/* 邮箱 — 仅普通模式 */}
              {!isGoogleMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱 <span className="text-red-500">*</span>
                    <span className="text-gray-400 text-xs ml-2">将作为登录凭证</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onBlur={handleEmailBlur}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="请输入邮箱地址"
                    />
                  </div>
                  {emailError && (
                    <p className="text-red-500 text-xs mt-1">{emailError}</p>
                  )}
                </div>
              )}

              {/* 手机号 - 选填 */}
              {!isGoogleMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手机号
                  <span className="text-gray-400 text-xs ml-2">选填</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="请输入手机号（选填）"
                  />
                </div>
              </div>
              )}

              {/* 密码 — 仅普通模式 */}
              {!isGoogleMode && (
              <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="至少6位密码"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  确认密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="再次输入密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名 <span className="text-red-500">*</span>
                  <span className="text-gray-400 text-xs ml-2">将作为URL后缀</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="您的网络昵称，如：星际旅人、代码诗人"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  身份标签 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="例如：AI研究者"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  个人Slogan
                  <span className="text-gray-400 text-xs ml-2">选填，将公开显示并影响SEO</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    rows={3}
                    value={formData.slogan}
                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm sm:text-base"
                    placeholder="一句话定义你自己..."
                  />
                </div>
              </div>

              {/* 所在地 - 四栏输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所在地 <span className="text-red-500">*</span>
                  <span className="text-gray-400 text-xs ml-2">国家、省/市、城市必填，社区/机构选填</span>
                </label>
                <div className="space-y-3">
                  {/* 国家 */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="国家 *"
                    />
                  </div>
                  {/* 省/市 */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="省/市 *"
                    />
                  </div>
                  {/* 城市 */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="城市 *"
                    />
                  </div>
                  {/* 社区/机构（选填） */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.community}
                      onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      placeholder="社区/机构（选填）"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <label htmlFor="isPublic" className="text-sm text-gray-700 font-medium">
                      允许搜索引擎收录此页面
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    公开信息仅包括：用户名、身份标签、个人Slogan、所在地。邮箱和手机号等敏感信息永远不会被公开。您可以在个人页面设置中随时更改此选项。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-gray-400" />
                    <label htmlFor="agreeTerms" className="text-sm text-gray-700 font-medium">
                      同意服务条款 <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    本站接受测试数据，正式版本将严格验证用户信息真实性
                  </p>
                </div>
              </div>

              {error && (
                <motion.p
                  className="text-red-500 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 sm:mt-8 flex items-center justify-center gap-2 px-6 py-3 bg-[#18181B] text-white font-medium rounded-lg hover:bg-[#27272A] transition-colors duration-200 disabled:opacity-50 text-sm sm:text-base"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {isGoogleMode ? '完成注册' : '立即创建'}
                </>
              )}
            </motion.button>

            {!isGoogleMode && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-gray-500 hover:text-[#18181B] transition-colors"
              >
                已有账户？立即登录
              </button>
            </div>
            )}
          </motion.form>
          )}
        </div>
      </main>
    </div>
  );
}
