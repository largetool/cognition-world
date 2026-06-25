/** 外站链接平台定义 */

export interface ExternalLink {
  platform: string;
  url: string;
}

export interface PlatformConfig {
  key: string;
  name: string;
  color: string;
  icon: string;
  urlPattern?: string; // 提示文本
}

export const EXTERNAL_LINK_PLATFORMS: PlatformConfig[] = [
  // —— 国内平台 ——
  { key: 'zhihu',        name: '知乎',         color: '#0066FF', icon: '知', urlPattern: 'https://zhihu.com/people/你的ID' },
  { key: 'bilibili',     name: 'B站',          color: '#FB7299', icon: 'B',  urlPattern: 'https://space.bilibili.com/你的UID' },
  { key: 'weibo',        name: '微博',         color: '#E6162D', icon: '微', urlPattern: 'https://weibo.com/u/你的ID' },
  { key: 'douyin',       name: '抖音',         color: '#111111', icon: '抖', urlPattern: 'https://douyin.com/user/你的ID' },
  { key: 'kuaishou',     name: '快手',         color: '#FF4906', icon: '快', urlPattern: 'https://kuaishou.com/profile/你的ID' },
  { key: 'xiaohongshu',  name: '小红书',       color: '#FF2442', icon: '红', urlPattern: 'https://xiaohongshu.com/user/profile/你的ID' },
  { key: 'wechat',       name: '微信公众号',   color: '#07C160', icon: '公', urlPattern: '微信公众号ID或二维码链接' },

  // —— 国际平台 ——
  { key: 'youtube',      name: 'YouTube',      color: '#FF0000', icon: 'YT', urlPattern: 'https://youtube.com/@你的频道' },
  { key: 'instagram',    name: 'Instagram',    color: '#E4405F', icon: 'IG', urlPattern: 'https://instagram.com/你的ID' },
  { key: 'facebook',     name: 'Facebook',     color: '#1877F2', icon: 'FB', urlPattern: 'https://facebook.com/你的ID' },
  { key: 'twitter',      name: 'X (Twitter)',  color: '#000000', icon: 'X',  urlPattern: 'https://x.com/你的ID' },
  { key: 'linkedin',     name: 'LinkedIn',     color: '#0A66C2', icon: 'in', urlPattern: 'https://linkedin.com/in/你的ID' },
  { key: 'github',       name: 'GitHub',       color: '#181717', icon: 'GH', urlPattern: 'https://github.com/你的用户名' },
  { key: 'medium',       name: 'Medium',       color: '#000000', icon: 'M',  urlPattern: 'https://medium.com/@你的ID' },
  { key: 'personal',     name: '个人网站',     color: '#6366F1', icon: '网', urlPattern: 'https://你的网站.com' },
];

export function getPlatformConfig(key: string): PlatformConfig | undefined {
  return EXTERNAL_LINK_PLATFORMS.find(p => p.key === key);
}
