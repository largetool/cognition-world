【1. **`/home/project/src/App.tsx`** - 路由配置】

import { HashRouter, Routes, Route } from 'react-router-dom';

import IndexPage from './pages/IndexPage';

import RegisterPage from './pages/RegisterPage';

import LoginPage from './pages/LoginPage';

import MePage from './pages/MePage';

import UserPage from './pages/UserPage';

function App() {

  return (

    <HashRouter>

      <Routes>

        <Route path="/" element={<IndexPage />} />

        <Route path="/register" element={<RegisterPage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/me" element={<MePage />} />

        <Route path="/:userId" element={<UserPage />} />

      </Routes>

    </HashRouter>

  );

}

export default App;

【1. **`/home/project/src/hooks/useAuth.ts`** - 认证状态管理 不存在，但有个
1.   **/home/project/src/hooks/useTheme.ts** 】

import { useEffect, useState } from 'react';

  

export type Theme = 'light' | 'dark';

  

/**

* 获取初始主题

* 优先从 DOM 上读取父窗口可能已设置的主题，避免闪烁

*/

function getInitialTheme(): Theme {

if (typeof document === 'undefined') return 'light';

  

// 检查 document.documentElement 上是否已有主题类或属性

const dataTheme = document.documentElement.getAttribute('data-theme');

if (dataTheme === 'dark' || dataTheme === 'light') {

return dataTheme;

}

  

// 检查类名

if (document.documentElement.classList.contains('dark')) {

return 'dark';

}

if (document.documentElement.classList.contains('light')) {

return 'light';

}

  

// 默认 light

return 'light';

}

  

/**

* 监听父窗口的主题切换消息

*/

export function useTheme() {

const [theme, setTheme] = useState<Theme>(getInitialTheme);

  

useEffect(() => {

// 监听来自父窗口的主题切换消息

const handleMessage = (event: MessageEvent) => {

// 安全性检查：可根据需要验证 event.origin

if (event.data && typeof event.data.theme === 'string') {

const newTheme = event.data.theme as Theme;

if (newTheme === 'light' || newTheme === 'dark') {

setTheme(newTheme);

// 应用主题到DOM

applyTheme(newTheme);

}

}

};

  

window.addEventListener('message', handleMessage);

  

// 初始化时应用当前主题到DOM（确保首次渲染正确）

const initialTheme = getInitialTheme();

applyTheme(initialTheme);

  

return () => {

window.removeEventListener('message', handleMessage);

};

}, []);

  

return theme;

}

  

/**

* 应用主题到DOM

*/

function applyTheme(theme: Theme) {

if (typeof document === 'undefined') return;

  

// 移除旧的主题类

document.documentElement.classList.remove('light', 'dark');

// 添加新的主题类

document.documentElement.classList.add(theme);

// 设置data-theme属性

document.documentElement.setAttribute('data-theme', theme);

}



【**`/home/project/src/pages/LoginPage.tsx`** - 登录页面逻辑】

import { useState } from 'react';

import { motion } from 'framer-motion';

import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Phone, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

import { loginWithPhone } from '../utils/auth';

  

export default function LoginPage() {

const navigate = useNavigate();

const [formData, setFormData] = useState({

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

const { session, error: loginError } = await loginWithPhone(formData.phone, formData.password);

if (loginError) {

setError('手机号或密码错误');

setIsSubmitting(false);

return;

}

if (session) {

navigate('/me');

}

setIsSubmitting(false);

};

  

return (

<div className="min-h-screen bg-[#FAFAFA] text-[#18181B]">

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

<div className="max-w-md mx-auto">

<motion.div

className="text-center mb-8"

initial={{ opacity: 0, y: 20 }}

animate={{ opacity: 1, y: 0 }}

>

<h1 className="text-2xl sm:text-3xl font-bold mb-2">登录</h1>

<p className="text-gray-500">使用手机号登录您的账户</p>

</motion.div>

  

<motion.form

onSubmit={handleSubmit}

className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm"

initial={{ opacity: 0, y: 20 }}

animate={{ opacity: 1, y: 0 }}

transition={{ delay: 0.1 }}

>

<div className="space-y-5">

<div>

<label className="block text-sm font-medium text-gray-700 mb-2">

手机号

</label>

<div className="relative">

<Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

<input

type="tel"

required

value={formData.phone}

onChange={(e) => setFormData({ ...formData, phone: e.target.value })}

className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"

placeholder="请输入手机号"

/>

</div>

</div>

  

<div>

<label className="block text-sm font-medium text-gray-700 mb-2">

密码

</label>

<div className="relative">

<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

<input

type={showPassword ? 'text' : 'password'}

required

value={formData.password}

onChange={(e) => setFormData({ ...formData, password: e.target.value })}

className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"

placeholder="请输入密码"

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

className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-[#18181B] text-white font-medium rounded-lg hover:bg-[#27272A] transition-colors disabled:opacity-50"

whileHover={{ scale: 1.01 }}

whileTap={{ scale: 0.99 }}

>

{isSubmitting ? (

<>

<Loader2 className="w-4 h-4 animate-spin" />

登录中...

</>

) : (

'登录'

)}

</motion.button>

  

<div className="mt-6 text-center">

<button

type="button"

onClick={() => navigate('/register')}

className="text-sm text-gray-500 hover:text-[#18181B] transition-colors"

>

还没有账户？立即注册

</button>

</div>

</motion.form>

</div>

</main>

</div>

);

}


【**`/home/project/src/pages/RegisterPage.tsx`** - 注册页面逻辑】

import { useState } from 'react';

import { motion } from 'framer-motion';

import { useNavigate } from 'react-router-dom';

import { ArrowLeft, User, Tag, MapPin, MessageSquare, Globe, Check, Phone, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

import { registerWithPhone } from '../utils/auth';

import { generateUserId } from '../types';

  

export default function RegisterPage() {

const navigate = useNavigate();

const [formData, setFormData] = useState({

phone: '',

password: '',

confirmPassword: '',

username: '',

tag: '',

slogan: '',

location: '',

isPublic: true

});

const [showPassword, setShowPassword] = useState(false);

const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const [isSubmitting, setIsSubmitting] = useState(false);

const [registered, setRegistered] = useState(false);

const [error, setError] = useState('');

  

const handleSubmit = async (e: React.FormEvent) => {

e.preventDefault();

setError('');

if (formData.password !== formData.confirmPassword) {

setError('两次输入的密码不一致');

return;

}

if (formData.password.length < 6) {

setError('密码长度至少为6位');

return;

}

setIsSubmitting(true);

const userId = generateUserId(formData.username);

const { user, error: registerError } = await registerWithPhone(

formData.phone,

formData.password,

{

username: formData.username,

user_id: userId,

tag: formData.tag,

slogan: formData.slogan,

location: formData.location,

is_public: formData.isPublic

}

);

if (registerError) {

setError(registerError.message || '注册失败，请重试');

setIsSubmitting(false);

return;

}

if (user) {

setRegistered(true);

} else {

setError('注册失败，请重试');

setIsSubmitting(false);

}

};

  

const goToLogin = () => {

navigate('/login');

};

  

if (registered) {

return (

<div className="min-h-screen bg-[#FAFAFA] text-[#18181B]">

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

现在您可以使用手机号和密码登录了

</p>

<motion.button

onClick={goToLogin}

className="w-full px-6 py-3 bg-[#18181B] text-white rounded-lg hover:bg-[#27272A] transition-colors"

whileHover={{ scale: 1.01 }}

whileTap={{ scale: 0.99 }}

>

去登录

</motion.button>

</motion.div>

</div>

</main>

</div>

);

}

  

return (

<div className="min-h-screen bg-[#FAFAFA] text-[#18181B]">

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

<h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">创建你的数字身份</h1>

<p className="text-sm sm:text-base text-gray-500">填写以下信息，生成你的个人页面</p>

</motion.div>

  

<motion.form

onSubmit={handleSubmit}

className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm"

initial={{ opacity: 0, y: 20 }}

animate={{ opacity: 1, y: 0 }}

transition={{ duration: 0.5, delay: 0.1 }}

>

<div className="space-y-5 sm:space-y-6">

<div>

<label className="block text-sm font-medium text-gray-700 mb-2">

手机号 <span className="text-red-500">*</span>

</label>

<div className="relative">

<Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

<input

type="tel"

required

value={formData.phone}

onChange={(e) => setFormData({ ...formData, phone: e.target.value })}

className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"

placeholder="请输入手机号"

/>

</div>

</div>

  

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

placeholder="例如：一言超人"

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

  

<div>

<label className="block text-sm font-medium text-gray-700 mb-2">

所在地 <span className="text-red-500">*</span>

</label>

<div className="relative">

<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

<input

type="text"

required

value={formData.location}

onChange={(e) => setFormData({ ...formData, location: e.target.value })}

className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"

placeholder="例如：北京市延庆区"

/>

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

<div className="flex items-center gap-2">

<Globe className="w-4 h-4 text-gray-400" />

<label htmlFor="isPublic" className="text-sm text-gray-600">

允许搜索引擎收录此页面

</label>

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

立即创建

</>

)}

</motion.button>

  

<div className="mt-6 text-center">

<button

type="button"

onClick={() => navigate('/login')}

className="text-sm text-gray-500 hover:text-[#18181B] transition-colors"

>

已有账户？立即登录

</button>

</div>

</motion.form>

</div>

</main>

</div>

);

}

【1. **`/home/project/src/pages/MePage.tsx`** - 个人中心页面（跳转目标）】

import { useState, useEffect, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate } from 'react-router-dom';

import { ArrowLeft, MapPin, Calendar, Eye, EyeOff, LogOut, User, Edit3, X, Save, Send, Clock, Image, Upload, CheckCircle, AlertCircle, Trash2, Check } from 'lucide-react';

import { getCurrentUser, logout, updateProfile } from '../utils/auth';

import { getLogsByUserId, createLog, getBackgroundImages, uploadBackgroundImage, setActiveBackgroundImage, deleteBackgroundImage } from '../utils/storage';

import { LogData, BackgroundImageData } from '../types';

import { SEOHead, generateProfilePageSchema, generatePersonSchema, generateBlogPostingSchema, generateKnowledgeGraphData } from '../components/SEOHead';

  

export default function MePage() {

const navigate = useNavigate();

const fileInputRef = useRef<HTMLInputElement>(null);

const [profile, setProfile] = useState<any>(null);

const [logs, setLogs] = useState<LogData[]>([]);

const [isLoading, setIsLoading] = useState(true);

const [isEditing, setIsEditing] = useState(false);

const [editForm, setEditForm] = useState({ tag: '', slogan: '', location: '' });

const [newLogContent, setNewLogContent] = useState('');

const [isPublishing, setIsPublishing] = useState(false);

const [backgroundImages, setBackgroundImages] = useState<BackgroundImageData[]>([]);

const [isUploading, setIsUploading] = useState(false);

const [showBgSettings, setShowBgSettings] = useState(false);

const [uploadError, setUploadError] = useState('');

  

useEffect(() => {

const loadData = async () => {

const { profile: userProfile } = await getCurrentUser();

if (!userProfile) {

navigate('/login');

return;

}

setProfile(userProfile);

setEditForm({

tag: userProfile.tag,

slogan: userProfile.slogan || '',

location: userProfile.location

});

  

const userLogs = await getLogsByUserId(userProfile.user_id);

setLogs(userLogs);

  

const bgImages = await getBackgroundImages(userProfile.id);

setBackgroundImages(bgImages);

  

setIsLoading(false);

};

loadData();

}, [navigate]);

  

const handleLogout = async () => {

await logout();

navigate('/');

};

  

const handleSave = async () => {

if (!profile) return;

const { profile: updated } = await updateProfile(profile.id, editForm);

if (updated) {

setProfile(updated);

setIsEditing(false);

}

};

  

const handlePublishLog = async () => {

if (!profile || !newLogContent.trim()) return;

setIsPublishing(true);

const newLog = await createLog(profile.user_id, newLogContent.trim());

if (newLog) {

setLogs([newLog, ...logs]);

setNewLogContent('');

}

setIsPublishing(false);

};

  

const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {

const file = e.target.files?.[0];

if (!file || !profile) return;

  

if (!file.type.startsWith('image/')) {

setUploadError('请上传图片文件');

return;

}

  

if (file.size > 5 * 1024 * 1024) {

setUploadError('图片大小不能超过5MB');

return;

}

  

setIsUploading(true);

setUploadError('');

  

const newImage = await uploadBackgroundImage(profile.id, file);

if (newImage) {

setBackgroundImages([newImage, ...backgroundImages]);

} else {

setUploadError('上传失败，请重试');

}

  

setIsUploading(false);

if (fileInputRef.current) {

fileInputRef.current.value = '';

}

};

  

const handleSetActive = async (imageId: string) => {

if (!profile) return;

const success = await setActiveBackgroundImage(profile.id, imageId);

if (success) {

const updatedImages = backgroundImages.map(img => ({

...img,

isActive: img.id === imageId

}));

setBackgroundImages(updatedImages);

}

};

  

const handleDelete = async (imageId: string) => {

const success = await deleteBackgroundImage(imageId);

if (success) {

setBackgroundImages(backgroundImages.filter(img => img.id !== imageId));

}

};

  

const getStatusIcon = (status: string) => {

switch (status) {

case 'approved':

return <CheckCircle className="w-4 h-4 text-green-500" />;

case 'pending':

return <Clock className="w-4 h-4 text-amber-500" />;

case 'rejected':

return <AlertCircle className="w-4 h-4 text-red-500" />;

default:

return null;

}

};

  

const getStatusText = (status: string) => {

switch (status) {

case 'approved':

return '已通过';

case 'pending':

return '审核中';

case 'rejected':

return '已拒绝';

default:

return status;

}

};

  

if (isLoading) {

return (

<div className="min-h-screen bg-white flex items-center justify-center">

<div className="w-8 h-8 border-2 border-gray-200 border-t-[#1a1a1a] rounded-full animate-spin" />

</div>

);

}

  

if (!profile) return null;

  

const pageTitle = `${profile.username} | 认知界`;

const pageDescription = profile.slogan || `${profile.username} — ${profile.tag}`;

const pageUrl = `https://cognition.world/#/${profile.user_id}`;

  

const jsonLd = [

generateProfilePageSchema(profile),

generatePersonSchema(profile),

...(logs.length > 0 ? generateBlogPostingSchema(logs.map((log: LogData) => ({ ...log, username: profile.username }))) : []),

...generateKnowledgeGraphData({

username: profile.username,

userId: profile.user_id,

tag: profile.tag,

slogan: profile.slogan,

location: profile.location,

logs: logs.map((l: LogData) => ({ content: l.content, createdAt: l.createdAt }))

})

];

  

return (

<>

<SEOHead

title={pageTitle}

description={pageDescription}

keywords={[profile.username, profile.tag, '数字身份', '认知界']}

author={profile.username}

type="profile"

url={pageUrl}

jsonLd={jsonLd}

/>

<div className="min-h-screen bg-white">

<div className="fixed inset-0 pointer-events-none">

<div className="absolute top-0 left-0 right-0 h-[60vh] bg-gradient-to-b from-[#fafafa] via-white to-transparent" />

<div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-radial from-gray-100/30 to-transparent rounded-full blur-3xl" />

</div>

  

<nav className="fixed top-0 left-0 right-0 z-50 glass">

<div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">

<button

onClick={() => navigate('/')}

className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#1a1a1a] transition-colors"

>

<ArrowLeft className="w-4 h-4" />

<span>返回首页</span>

</button>

  

<div className="flex items-center gap-2">

<button

onClick={() => setShowBgSettings(!showBgSettings)}

className="p-2 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] rounded-lg transition-colors"

>

<Image className="w-4 h-4" />

</button>

<button

onClick={() => setIsEditing(!isEditing)}

className="p-2 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] rounded-lg transition-colors"

>

<Edit3 className="w-4 h-4" />

</button>

<button

onClick={handleLogout}

className="p-2 text-[#6b7280] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"

>

<LogOut className="w-4 h-4" />

</button>

</div>

</div>

</nav>

  

<main className="relative z-10 pt-32 pb-20 px-6">

<div className="max-w-xl mx-auto">

<motion.div

className="text-center mb-12"

initial={{ opacity: 0, y: 20 }}

animate={{ opacity: 1, y: 0 }}

transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}

>

<motion.div

className="w-20 h-20 mx-auto mb-6 bg-[#1a1a1a] rounded-2xl flex items-center justify-center shadow-lg"

initial={{ opacity: 0, scale: 0.9 }}

animate={{ opacity: 1, scale: 1 }}

transition={{ duration: 0.5, delay: 0.1 }}

>

<span className="text-white font-semibold text-2xl">{profile.username?.[0] || 'U'}</span>

</motion.div>

  

<motion.h1

className="text-2xl font-semibold text-[#1a1a1a] mb-2 tracking-tight"

initial={{ opacity: 0, y: 10 }}

animate={{ opacity: 1, y: 0 }}

transition={{ duration: 0.5, delay: 0.2 }}

>

{profile.username}

</motion.h1>

  

<motion.p

className="text-sm text-[#6b7280] mb-4"

initial={{ opacity: 0, y: 10 }}

animate={{ opacity: 1, y: 0 }}

transition={{ duration: 0.5, delay: 0.25 }}

>

{profile.tag}

</motion.p>

  

{profile.slogan && (

<motion.p

className="text-[#6b7280] leading-relaxed max-w-md mx-auto text-[0.9375rem]"

initial={{ opacity: 0, y: 10 }}

animate={{ opacity: 1, y: 0 }}

transition={{ duration: 0.5, delay: 0.3 }}

>

{profile.slogan}

</motion.p>

)}

</motion.div>

  

<AnimatePresence>

{isEditing && (

<motion.div

className="mb-8"

initial={{ opacity: 0, y: 20 }}

animate={{ opacity: 1, y: 0 }}

exit={{ opacity: 0, y: -20 }}

>

<div className="glass-card rounded-2xl p-5">

<div className="flex items-center justify-between mb-4">

<h3 className="text-sm font-medium text-[#1a1a1a] flex items-center gap-2">

<Edit3 className="w-4 h-4 text-[#6b7280]" />

编辑资料

</h3>

<button

onClick={() => setIsEditing(false)}

className="p-1.5 text-[#9ca3af] hover:text-[#1a1a1a]"

>

<X className="w-4 h-4" />

</button>

</div>

<div className="space-y-3">

<div>

<label className="block text-xs text-[#9ca3af] mb-1.5">身份标签</label>

<input

type="text"

value={editForm.tag}

onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}

className="w-full px-3 py-2.5 bg-[#fafafa] border border-transparent rounded-xl text-sm text-[#1a1a1a] focus:outline-none focus:bg-white focus:border-[rgba(0,0,0,0.08)] transition-all"

/>

</div>

<div>

<label className="block text-xs text-[#9ca3af] mb-1.5">个人Slogan</label>

<textarea

rows={2}

value={editForm.slogan}

onChange={(e) => setEditForm({ ...editForm, slogan: e.target.value })}

className="w-full px-3 py-2.5 bg-[#fafafa] border border-transparent rounded-xl text-sm text-[#1a1a1a] focus:outline-none focus:bg-white focus:border-[rgba(0,0,0,0.08)] resize-none transition-all"

/>

</div>

<div>

<label className="block text-xs text-[#9ca3af] mb-1.5">所在地</label>

<input

type="text"

value={editForm.location}

onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}

className="w-full px-3 py-2.5 bg-[#fafafa] border border-transparent rounded-xl text-sm text-[#1a1a1a] focus:outline-none focus:bg-white focus:border-[rgba(0,0,0,0.08)] transition-all"

/>

</div>

</div>

<div className="flex gap-3 mt-4">

<button

onClick={() => setIsEditing(false)}

className="flex-1 px-4 py-2.5 border border-[rgba(0,0,0,0.08)] rounded-xl text-[#6b7280] hover:bg-[#fafafa] text-sm transition-colors"

>

取消

</button>

<button

onClick={handleSave}

className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white rounded-xl hover:bg-[#333] flex items-center justify-center gap-2 text-sm transition-colors"

>

<Save className="w-4 h-4" />

保存

</button>

</div>

</div>

</motion.div>

)}

</AnimatePresence>

  

<AnimatePresence>

{showBgSettings && (

<motion.div

className="mb-8"

initial={{ opacity: 0, y: 20 }}

animate={{ opacity: 1, y: 0 }}

exit={{ opacity: 0, y: -20 }}

>

<div className="glass-card rounded-2xl p-5">

<div className="flex items-center justify-between mb-4">

<h3 className="text-sm font-medium text-[#1a1a1a] flex items-center gap-2">

<Image className="w-4 h-4 text-[#6b7280]" />

背景图设置

</h3>

<button

onClick={() => setShowBgSettings(false)}

className="p-1.5 text-[#9ca3af] hover:text-[#1a1a1a]"

>

<X className="w-4 h-4" />

</button>

</div>

  

<div className="mb-4">

<input

type="file"

ref={fileInputRef}

onChange={handleFileSelect}

accept="image/*"

className="hidden"

/>

<button

onClick={() => fileInputRef.current?.click()}

disabled={isUploading}

className="w-full px-4 py-3 border border-dashed border-[rgba(0,0,0,0.15)] rounded-xl text-[#6b7280] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"

>

{isUploading ? (

<>

<div className="w-4 h-4 border-2 border-gray-300 border-t-[#1a1a1a] rounded-full animate-spin" />

<span>上传中...</span>

</>

) : (

<>

<Upload className="w-4 h-4" />

<span>上传背景图</span>

</>

)}

</button>

{uploadError && (

<p className="mt-2 text-xs text-red-500">{uploadError}</p>

)}

<p className="mt-2 text-xs text-[#9ca3af]">支持 JPG、PNG 格式，最大 5MB</p>

</div>

  

{backgroundImages.length > 0 && (

<div className="space-y-3">

<h4 className="text-xs text-[#9ca3af]">我的背景图</h4>

<div className="grid grid-cols-2 gap-3">

{backgroundImages.map((img) => (

<motion.div

key={img.id}

className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-colors ${

img.isActive ? 'border-[#1a1a1a]' : 'border-transparent'

}`}

initial={{ opacity: 0, scale: 0.95 }}

animate={{ opacity: 1, scale: 1 }}

>

<img

src={img.url}

alt="背景图"

className="w-full h-full object-cover"

/>

<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

<div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">

<div className="flex items-center gap-1">

{getStatusIcon(img.status)}

<span className="text-xs text-white">{getStatusText(img.status)}</span>

</div>

<div className="flex items-center gap-1">

{img.status === 'approved' && (

<button

onClick={() => handleSetActive(img.id)}

className={`p-1.5 rounded-lg transition-colors ${

img.isActive

? 'bg-[#1a1a1a] text-white'

: 'bg-white/20 text-white hover:bg-white/30'

}`}

>

<Check className="w-3 h-3" />

</button>

)}

<button

onClick={() => handleDelete(img.id)}

className="p-1.5 bg-white/20 text-white hover:bg-red-500/80 rounded-lg transition-colors"

>

<Trash2 className="w-3 h-3" />

</button>

</div>

</div>

</motion.div>

))}

</div>

</div>

)}

</div>

</motion.div>

)}

</AnimatePresence>

  

{!isEditing && !showBgSettings && (

<motion.div

className="glass-card rounded-2xl p-5 mb-8"

initial={{ opacity: 0, y: 20 }}

animate={{ opacity: 1, y: 0 }}

transition={{ duration: 0.5, delay: 0.35 }}

>

<div className="space-y-3">

<div className="flex items-center gap-3 text-sm text-[#6b7280]">

<MapPin className="w-4 h-4 text-[#9ca3af]" />

<span>{profile.location}</span>

</div>

<div className="flex items-center gap-3 text-sm text-[#6b7280]">

<Calendar className="w-4 h-4 text-[#9ca3af]" />

<span>加入于 {profile.created_at?.split('T')[0]}</span>

</div>

<div className="flex items-center gap-3 text-sm">

{profile.is_public ? (

<>

<Eye className="w-4 h-4 text-green-500" />

<span className="text-green-600">公开收录</span>

</>

) : (

<>

<EyeOff className="w-4 h-4 text-[#9ca3af]" />

<span className="text-[#6b7280]">私密状态</span>

</>

)}

</div>

</div>

</motion.div>

)}

  

<motion.div

className="mb-8"

initial={{ opacity: 0, y: 20 }}

animate={{ opacity: 1, y: 0 }}

transition={{ duration: 0.5, delay: 0.4 }}

>

<div className="flex items-center gap-2 mb-3 text-sm text-[#9ca3af]">

<Send className="w-4 h-4" />

<span>记录今日认知</span>

</div>

<div className="glass-card rounded-2xl p-4">

<textarea

rows={3}

value={newLogContent}

onChange={(e) => setNewLogContent(e.target.value)}

className="w-full px-0 py-0 bg-transparent border-0 text-[0.9375rem] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none resize-none"

placeholder="分享你的想法..."

/>

<div className="flex justify-end mt-3">

<motion.button

onClick={handlePublishLog}

disabled={isPublishing || !newLogContent.trim()}

className="px-4 py-2 bg-[#1a1a1a] text-white text-sm font-medium rounded-lg hover:bg-[#333] transition-colors disabled:opacity-40"

whileHover={{ scale: 1.02 }}

whileTap={{ scale: 0.98 }}

>

{isPublishing ? '发布中...' : '发布'}

</motion.button>

</div>

</div>

</motion.div>

  

{logs.length > 0 && (

<motion.div

className="space-y-4"

initial={{ opacity: 0 }}

animate={{ opacity: 1 }}

transition={{ duration: 0.5, delay: 0.45 }}

>

<div className="flex items-center gap-2 text-sm text-[#9ca3af] mb-4">

<Clock className="w-4 h-4" />

<span>认知日志</span>

</div>

<div className="space-y-3">

{logs.map((log: LogData, index: number) => (

<motion.article

key={log.id}

className="glass-card rounded-2xl p-5"

initial={{ opacity: 0, y: 20 }}

animate={{ opacity: 1, y: 0 }}

transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}

>

<div className="flex items-center gap-2 text-xs text-[#9ca3af] mb-2">

<time>{log.createdAt}</time>

</div>

<p className="text-[0.9375rem] text-[#1a1a1a] leading-relaxed whitespace-pre-wrap">

{log.content}

</p>

</motion.article>

))}

</div>

</motion.div>

)}

  

<motion.div

className="mt-12 text-center text-xs text-[#9ca3af]"

initial={{ opacity: 0 }}

animate={{ opacity: 1 }}

transition={{ duration: 0.5, delay: 0.6 }}

>

时空锚点 · 2026-04-26 · 北京市延庆区

</motion.div>

</div>

</main>

</div>

</>

);

}

【1. **`/home/project/src/utils/auth.ts`** - 认证工具函数】

import { supabase } from '../supabase/client';

  

function generateVirtualEmail(phone: string): string {

return `${phone.replace(/\D/g, '')}@phone.local`;

}

  

export async function registerWithPhone(phone: string, password: string, metadata: {

username: string;

user_id: string;

tag: string;

slogan: string;

location: string;

is_public: boolean;

}) {

const email = generateVirtualEmail(phone);

const { data, error } = await supabase.auth.signUp({

email,

password,

options: {

data: {

...metadata,

phone

}

}

});

return { user: data?.user, error };

}

  

export async function loginWithPhone(phone: string, password: string) {

const email = generateVirtualEmail(phone);

const { data, error } = await supabase.auth.signInWithPassword({

email,

password

});

return { session: data?.session, user: data?.user, error };

}

  

export async function logout() {

const { error } = await supabase.auth.signOut();

return { error };

}

  

export async function getCurrentSession() {

const { data: { session }, error } = await supabase.auth.getSession();

return { session, error };

}

  

export async function getCurrentUser() {

const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {

return { user: null, profile: null, error };

}

const { data: profile, error: profileError } = await supabase

.from('profiles')

.select('*')

.eq('id', user.id)

.maybeSingle();

return { user, profile, error: profileError };

}

  

export async function updateProfile(userId: string, updates: {

tag?: string;

slogan?: string;

location?: string;

}) {

const { data, error } = await supabase

.from('profiles')

.update({ ...updates, updated_at: new Date().toISOString() })

.eq('id', userId)

.select()

.maybeSingle();

return { profile: data, error };

}