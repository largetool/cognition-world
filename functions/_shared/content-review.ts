/**
 * 内容安全审核模块
 * 
 * Beta 阶段：基础敏感词过滤
 * 
 * ========== 升级指南（阿里云内容安全 API）==========
 * 1. 在 supabase/functions 目录下安装依赖或使用 fetch 调用阿里云 API
 * 2. 在 Supabase Dashboard 的 Edge Function 配置中添加环境变量：
 *    - ALIBABA_CLOUD_ACCESS_KEY
 *    - ALIBABA_CLOUD_SECRET_KEY
 *    - ALIBABA_CLOUD_MODERATION_ENDPOINT
 * 3. 替换本文件中的 reviewText() 函数实现
 * 4. 所有调用入口自动生效，无需逐个修改
 * ================================================
 */

// 敏感词列表（可根据业务需要扩展）
const BLOCKED_WORDS = [
  // 违法违规
  "赌博", "赌场", "博彩", "色情", "裸聊", "一夜情",
  "毒品", "摇头丸", "冰毒", "海洛因",
  "枪支", "弹药", "爆炸物",
  "代购", "刷单", "水军", "刷分",
  // 垃圾广告
  "加微信", "加v信", "加qq", "扫码加",
  "兼职日结", "工资日结",
  // 政治敏感（基础过滤，后续升级 API 可替代）
];

// 常见变体替换（绕过检测的常见写法）
function normalizeText(text: string): string {
  return text
    .replace(/[0-9]+/g, '')     // 去掉数字（防 "赌9博" 绕过）
    .replace(/\s+/g, '')         // 去掉空格（防 "加 微 信" 绕过）
    .toLowerCase();
}

/**
 * 内容审核函数
 * Beta 阶段使用关键词匹配
 * 
 * @param text - 需要审核的文本内容
 * @param type - 内容类型：'slogan' | 'thought' | 'guestbook' | 'profile' | 'username'
 * @returns { pass: boolean, reason?: string }
 */
export async function reviewText(
  text: string,
  type: 'slogan' | 'thought' | 'guestbook' | 'profile' | 'username'
): Promise<{ pass: boolean; reason?: string }> {
  if (!text || text.trim().length === 0) {
    return { pass: false, reason: "内容不能为空" };
  }

  const normalized = normalizeText(text);

  // 敏感词匹配
  for (const word of BLOCKED_WORDS) {
    if (normalized.includes(word)) {
      return { pass: false, reason: "内容包含违规信息，请修改后重试" };
    }
  }

  // 用户名特殊规则
  if (type === 'username') {
    if (text.length < 2 || text.length > 20) {
      return { pass: false, reason: "用户名长度需在2-20个字符之间" };
    }
  }

  // TODO: 阿里云内容安全 API 接入位置
  // 在此处调用外部 API 进行深度语义审核
  // const aliReview = await callAliyunModeration(text, type);
  // if (!aliReview.pass) { return aliReview; }

  return { pass: true };
}
