import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="zh-CN" data-theme="light" className="light">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="google-site-verification" content="ORlVyhNvJlJPmY1CZy5mINamnmRKmL_7aHI95s2oe08" />
        <meta name="msvalidate.01" content="1B96BAC6CA69BDB19B5F05326D020D93" />
        <meta name="googlebot" content="index, follow" />

        <link rel="alternate" hrefLang="zh-CN" href="https://uptef.com/" />
        <link rel="alternate" hrefLang="en" href="https://uptef.com/en" />
        <link rel="alternate" hrefLang="x-default" href="https://uptef.com/" />

        <meta name="description" content="一个面向全球用户的公开信息平台，提供不可删除、不可篡改、可索引的个人 GEO 信誉记录，让搜索引擎与 LLM 能够理解每个用户。" />
        <meta name="keywords" content="个人GEO,个人SEO,AI可索引,公开身份平台,数字实体,人本位,个人主页,黄页,AI,认知,索引,GEO,全民GEO,CognitionWorld,个人品牌,数字身份,LLM索引,全球目录,Schema.org,结构化数据,AI搜索,AI引用,数字信誉,Generative Engine Optimization,个人知识图谱,公开日志,可验证信息" />

        <meta property="og:title" content="认知界 - 让AI认识每一个具体的普通人" />
        <meta property="og:description" content="一个面向全球用户的公开信息平台，提供不可删除、不可篡改、可索引的个人 GEO 信誉记录。" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://uptef.com/" />
        <meta property="og:image" content="https://uptef.com/assets/C2283395-46CF-48E8-B1EC-3813518039AE.jpg" />
        <meta property="og:site_name" content="认知界 Cognition World" />
        <meta property="og:locale" content="zh_CN" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="认知界 - 让AI认识每一个具体的普通人" />
        <meta name="twitter:description" content="面向全球化的个人黄页索引，让 AI 认识每一个具体的普通人。" />

        {/* 全局 WebSite 结构化数据（所有页面共用，不包含 SearchAction——搜索页未实现） */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: '认知界 Cognition World',
            alternateName: '面向全球化的个人黄页索引 · 全民 GEO 公开信息平台',
            url: 'https://uptef.com/',
            description: '一个公开、可验证、不可删除的个人 GEO 信息平台。',
            inLanguage: 'zh-CN',
          }),
        }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: '认知界',
            alternateName: 'Cognition World',
            url: 'https://uptef.com/',
            description: '一个面向全球用户的公开信息平台，提供不可删除、不可篡改、可索引的个人 GEO 信誉记录，让搜索引擎与 LLM 能够理解每个用户。',
          }),
        }} />

        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>
      <body>
        <Main />
        <NextScript />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const isInIframe = window.self !== window.top;
              function applyThemeToDOM(theme) {
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(theme);
                document.documentElement.setAttribute('data-theme', theme);
              }
              if (isInIframe) {
                window.addEventListener('message', function(event) {
                  if (event.data && typeof event.data.theme === 'string') {
                    var theme = event.data.theme;
                    if (theme === 'light' || theme === 'dark') {
                      applyThemeToDOM(theme);
                    }
                  }
                });
              } else {
                applyThemeToDOM('light');
              }
            })();
          `,
        }} />
      </body>
    </Html>
  );
}
