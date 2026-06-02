import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../hooks/useAuth';
import { getUserById, updateProfile } from '../utils/auth';
import { getDefaultSEO, isAdminFromProfile } from '../types';
import type { Profile } from '../types';

export function EditPage() {
  const navigate = useNavigate();
  const { user } = useAuth() as { user: Profile | null };
  const [step, setStep] = useState<'token' | 'edit'>('token');
  const [userId, setUserId] = useState('');
  const [token, setToken] = useState('');
  const [targetUser, setTargetUser] = useState<Profile | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editData, setEditData] = useState({
    slogan: '',
    isHidden: false,
  });

  const isAdminUser = isAdminFromProfile(user);

  const handleVerifyToken = async () => {
    if (!userId || !token) {
      setError('请输入用户ID和编辑令牌');
      return;
    }

    setIsVerifying(true);
    setError(null);

    const profile = await getUserById(userId);

    if (!profile) {
      setError('用户不存在');
      setIsVerifying(false);
      return;
    }

    // 简化验证：管理员可以直接编辑，普通用户需要验证（这里简化处理）
    const canEdit = isAdminUser;

    if (canEdit) {
      setTargetUser(profile);
      setEditData({
        slogan: profile.slogan || '',
        isHidden: false,
      });
      setStep('edit');
    } else {
      setError('编辑令牌无效或已过期');
    }

    setIsVerifying(false);
  };

  const handleSave = async () => {
    if (!targetUser) return;

    setIsSaving(true);
    const { profile: updated, error: updateError } = await updateProfile(targetUser.user_id, {
      slogan: editData.slogan,
    });

    if (updated) {
      navigate(`/${targetUser.user_id}`);
    } else {
      setError(updateError instanceof Error ? updateError.message : '保存失败');
    }

    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEOHead data={{ ...getDefaultSEO(), title: '编辑资料 - 认知界' }} />
      <Navbar user={user} />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                编辑资料
              </h1>
              <p className="text-[var(--text-secondary)]">
                使用编辑令牌修改资料
              </p>
            </div>

            <GlassCard>
              {error && (
                <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {step === 'token' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      用户ID
                    </label>
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value.toUpperCase())}
                      placeholder="如：ONE"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      编辑令牌
                    </label>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value.toUpperCase())}
                      placeholder="16位编辑令牌"
                      className="input-field"
                      maxLength={16}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerifyToken}
                    disabled={isVerifying}
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                  >
                    <span>{isVerifying ? '验证中...' : '验证并继续'}</span>
                    {!isVerifying && <ChevronRight className="w-4 h-4" />}
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  {targetUser && (
                    <div className="mb-6 p-4 rounded-lg bg-[var(--bg-secondary)]">
                      <p className="text-sm text-[var(--text-secondary)]">
                        正在编辑：<span className="font-medium text-[var(--text-primary)]">{targetUser.username}</span>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                      Slogan
                    </label>
                    <input
                      type="text"
                      value={editData.slogan}
                      onChange={(e) => setEditData(prev => ({ ...prev, slogan: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isHidden"
                      checked={editData.isHidden}
                      onChange={(e) => setEditData(prev => ({ ...prev, isHidden: e.target.checked }))}
                      className="w-4 h-4 rounded border-[var(--border-light)] text-[var(--accent)]"
                    />
                    <label htmlFor="isHidden" className="ml-2 text-sm text-[var(--text-secondary)]">
                      隐藏此用户页面
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('token')}
                      className="flex-1 py-3 rounded-lg border border-[var(--border-light)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      返回
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 py-3 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </motion.button>
                  </div>
                </div>
              )}

              <div className="mt-6 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  返回首页
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
