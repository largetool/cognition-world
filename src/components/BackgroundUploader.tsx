import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, Clock, AlertCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import type { BackgroundImage } from '../types';
import { uploadBackgroundImage, deleteBackgroundImage } from '../utils/storage';
import { selectSystemBackground } from '../utils/storage';

interface BackgroundUploaderProps {
  userId: string;
  backgrounds: BackgroundImage[];
  activeBackground: BackgroundImage | null;
  onRefresh: () => void;
}

export function BackgroundUploader({ userId, backgrounds, activeBackground, onRefresh }: BackgroundUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('图片大小不能超过 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const result = await uploadBackgroundImage(userId, file);

    if (result.success) {
      onRefresh();
    } else {
      setUploadError(result.error || '上传失败');
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSetActive = async (imageId: string) => {
    const image = backgrounds.find(bg => bg.id === imageId);
    if (image?.url) {
      await selectSystemBackground(userId, image.url);
      onRefresh();
    }
  };

  const handleDelete = async (imageId: string) => {
    await deleteBackgroundImage(imageId);
    onRefresh();
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
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">背景图片</h3>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          <span>{isUploading ? '上传中...' : '上传图片'}</span>
        </motion.button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {uploadError && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          {uploadError}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {backgrounds.map((bg) => (
          <motion.div
            key={bg.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative rounded-xl overflow-hidden aspect-video group ${
              bg.is_active ? 'ring-2 ring-[var(--accent)]' : ''
            }`}
          >
            <img
              src={bg.url}
              alt="Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              {bg.status === 'approved' && !bg.is_active && (
                <button
                  onClick={() => handleSetActive(bg.id)}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleDelete(bg.id)}
                className="p-2 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-1 rounded-full bg-white/90 text-xs">
              {getStatusIcon(bg.status || 'pending')}
              <span>{getStatusText(bg.status || 'pending')}</span>
            </div>
            {bg.is_active && (
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-[var(--accent)] text-white text-xs">
                当前背景
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {backgrounds.length === 0 && (
        <div className="text-center py-8 text-[var(--text-tertiary)]">
          暂无背景图片
        </div>
      )}
    </div>
  );
}
