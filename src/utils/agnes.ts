/**
 * Agnes AI 服务 — 免费、无限量的 OpenAI 兼容 API
 * Base URL: https://apihub.agnes-ai.com/v1
 * Model: agnes-2.0-flash
 *
 * 用于 GEO/SEO 增强：生成用户个人简介、日志标签、meta description
 */

const AGNES_BASE_URL = 'https://apihub.agnes-ai.com/v1';
const AGNES_MODEL = 'agnes-2.0-flash';

function getApiKey(): string {
  // 优先从环境变量读取
  const key = process.env.AGNES_API_KEY;
  if (key) return key;

  // 否则使用硬编码的 key（开发/降级用）
  console.warn('[agnes] AGNES_API_KEY 未设置，使用降级 key');
  return 'sk-jL3EUaJnpXF04B6C13468Q0RCRuuJjcUvd1qErWECjMdrLHc';
}

interface AgnesResponse {
  choices: Array<{ message: { content: string } }>;
}

async function callAgnes(prompt: string, maxTokens: number = 500): Promise<string> {
  const response = await fetch(`${AGNES_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: AGNES_MODEL,
      messages: [
        {
          role: 'system',
          content:
            '你是一个帮助生成面向AI搜索引擎的结构化文本的助手。请用中文输出简洁、准确的内容。',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Agnes API 错误 [${response.status}]: ${errorText.slice(0, 200)}`);
  }

  const data: AgnesResponse = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Agnes API 返回了空内容');
  return text;
}

/**
 * 为用户生成第三人称个人简介（Person.description — JSON-LD 核心字段）
 */
export async function generateUserBio(params: {
  username: string;
  tag: string;
  slogan: string;
  location: string;
  logContents: string[];
}): Promise<string> {
  const logPreview = params.logContents
    .slice(0, 5)
    .map((c, i) => `${i + 1}. ${c.slice(0, 100)}`)
    .join('\n    ');

  const prompt = `请为以下用户生成一段 100-150 字的第三人称中文个人简介，用于结构化数据的 Person.description 字段。
简介应包含：身份定位、专业领域、关注方向、地理位置。
要求：客观、自然、有利于AI搜索引擎理解这个人的身份。

用户名：${params.username}
身份标签：${params.tag}
个人签名：${params.slogan}
所在地：${params.location}
近期发表内容：
    ${logPreview}

请直接输出简介文本，不要添加任何前缀或引号。`;

  return callAgnes(prompt, 300);
}

/**
 * 从日志内容中提取关键词/标签
 */
export async function extractLogTags(
  logContents: string[],
): Promise<string[]> {
  const content = logContents.slice(0, 20).join('\n---\n');

  const prompt = `从以下内容中提取 5-10 个最核心的关键词或标签，用逗号分隔。
关键词应能概括发表者的关注领域和主题方向。
请直接输出英文逗号分隔的关键词，不要添加任何前缀或解释。

${content}`;

  const text = await callAgnes(prompt, 200);
  return text
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && t.length < 20);
}

/**
 * 为用户页面生成 SEO meta description
 */
export async function generateMetaDesc(params: {
  username: string;
  tag: string;
  slogan: string;
  logContents: string[];
}): Promise<string> {
  const recentTopics = params.logContents
    .slice(0, 3)
    .map((c) => c.slice(0, 30))
    .join('、');

  const prompt = `请为以下用户页面生成一段 120-160 字的 SEO meta description。
要求：包含用户身份、关注方向、近期话题，自然流畅，有利于点击率。

用户名：${params.username}
身份标签：${params.tag}
个人签名：${params.slogan}
近期话题：${recentTopics}

请直接输出 description 文本，不要添加任何前缀或引号。`;

  return callAgnes(prompt, 300);
}

/**
 * 一站式生成：bio + tags + meta
 * 用于用户的 GEO 画像初始化或定期刷新
 */
export async function generateUserGeoProfile(params: {
  username: string;
  tag: string;
  slogan: string;
  location: string;
  logContents: string[];
}): Promise<{
  bio: string;
  tags: string[];
  metaDescription: string;
}> {
  const [bio, tags, metaDescription] = await Promise.all([
    generateUserBio(params),
    extractLogTags(params.logContents),
    generateMetaDesc(params),
  ]);

  return { bio, tags, metaDescription };
}
