/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 图片/静态资源
  images: {
    domains: ['nbgsichilfrjsopnnvia.supabase.co'],
  },

  // 英文路由 rewrite
  async rewrites() {
    return [
      // llms.txt → API route
      { source: '/llms.txt', destination: '/api/llms' },

      // 英文路由 → 中文组件（组件内部检测语言）
      { source: '/en', destination: '/' },
      { source: '/en/register', destination: '/register' },
      { source: '/en/login', destination: '/login' },
      { source: '/en/forgot-password', destination: '/forgot-password' },
      { source: '/en/reset-password', destination: '/reset-password' },
      { source: '/en/me', destination: '/me' },
      { source: '/en/messages', destination: '/messages' },
      { source: '/en/admin', destination: '/admin' },
      { source: '/en/whitepaper', destination: '/whitepaper' },
      { source: '/en/privacy', destination: '/privacy' },
      { source: '/en/terms', destination: '/terms' },
      { source: '/en/about', destination: '/about' },
      { source: '/en/contact', destination: '/contact' },
      { source: '/en/accessibility', destination: '/accessibility' },
      { source: '/en/guestbook', destination: '/guestbook' },
      { source: '/en/example/:userId', destination: '/example/:userId' },
      {
        source: '/en/:userId/thought/:thoughtId',
        destination: '/:userId/thought/:thoughtId',
      },
      { source: '/en/:userId', destination: '/:userId' },
    ];
  },
};

module.exports = nextConfig;
