/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 旧 sitemap.xml 301 重定向到动态 API
  async redirects() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
        permanent: true,
      },
    ];
  },

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
      { source: '/en/example/:displayId', destination: '/example/:displayId' },
      {
        source: '/en/:displayId/thought/:thoughtId',
        destination: '/:displayId/thought/:thoughtId',
      },
      { source: '/en/:displayId', destination: '/:displayId' },
    ];
  },
};

module.exports = nextConfig;
