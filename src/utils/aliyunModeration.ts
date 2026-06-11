// ============================================
// 阿里云 AI 安全护栏（Guardrails）审核客户端
// API: MultiModalGuard
// 文档: https://help.aliyun.com/zh/icp-filing/basic-icp-service/product-overview/...
// ============================================

import crypto from 'crypto';

// 从环境变量读取 AccessKey
let cachedKeyId: string | null = null;
let cachedKeySecret: string | null = null;

function getAccessKey() {
  if (!cachedKeyId || !cachedKeySecret) {
    cachedKeyId = process.env.ALIBABA_ACCESS_KEY_ID || null;
    cachedKeySecret = process.env.ALIBABA_ACCESS_KEY_SECRET || null;
  }
  return { keyId: cachedKeyId, keySecret: cachedKeySecret };
}

const ENDPOINT = 'https://green-cip.cn-shanghai.aliyuncs.com';
const REGION = 'cn-shanghai';
const SERVICE = 'green-cip';

/**
 * 调用阿里云 OpenAPI Signature v3
 * @param action API 动作（如 MultiModalGuard）
 * @param body 请求体 JSON
 */
async function callAliyunApi(action: string, body: Record<string, any>): Promise<any> {
  const { keyId, keySecret } = getAccessKey();
  if (!keyId || !keySecret) {
    throw new Error('阿里云 AccessKey 未配置（请在环境变量中设置 ALIBABA_ACCESS_KEY_ID 和 ALIBABA_ACCESS_KEY_SECRET）');
  }

  const bodyStr = JSON.stringify(body);
  const date = new Date();
  const dateStr = date.toISOString().replace(/[:\-]/g, '').substring(0, 8); // YYYYMMDD
  const requestDate = date.toUTCString();
  const nonce = crypto.randomUUID();

  // === 构造签名 ===
  // 参考 Alibaba Cloud OpenAPI Signature v3

  // 1. 参与签名的请求头（按字母排序）
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Host': 'green-cip.cn-shanghai.aliyuncs.com',
    'X-Acs-Action': action,
    'X-Acs-Version': '2022-03-02',
    'X-Acs-Signature-Nonce': nonce,
    'X-Acs-Date': requestDate,
  };

  // 按 header 名称字母排序
  const sortedHeaderKeys = Object.keys(headers).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // 2. CanonicalHeaders: header名小写 + ":" + 值.trim()
  const canonicalHeaders = sortedHeaderKeys
    .map(k => `${k.toLowerCase()}:${headers[k].trim()}`)
    .join('\n') + '\n';

  // 3. SignedHeaders: 小写 header 名集合
  const signedHeaders = sortedHeaderKeys.map(k => k.toLowerCase()).join(';');

  // 4. HashedPayload: Body 的 SHA256
  const payloadHash = crypto.createHash('sha256').update(bodyStr, 'utf8').digest('hex');

  // 5. CanonicalRequest
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  // 6. StringToSign
  const algorithm = 'ACS3-HMAC-SHA256';
  const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex');
  const stringToSign = `${algorithm}\n${requestDate}\n${canonicalRequestHash}`;

  // 7. Signature（直接用 AccessKeySecret 做 HMAC-SHA256）
  const signature = crypto.createHmac('sha256', keySecret).update(stringToSign, 'utf8').digest('hex');

  // 8. Authorization
  const credential = `${keyId}/${dateStr}/${REGION}/${SERVICE}/aliyun_v4_request`;
  const authorization = `${algorithm} Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // === 发送请求 ===
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      ...headers,
      'Authorization': authorization,
    },
    body: bodyStr,
  });

  const result = await response.json();
  return result;
}

// ========== 对外接口 ==========

/** 文本审核 Service */
export type ModerationService = 'query_security_check' | 'query_security_check_pro';

export interface ModerationResult {
  passed: boolean;           // true=通过, false=违规
  suggestion: string;        // pass / block / watch / mask
  label: string | null;      // 违规标签（如 political_xxx）
  description: string | null; // 违规描述
  detail: any[];
}

/**
 * 审核文本内容
 * @param content 用户发布的内容（最多 2000 字）
 * @param service 审核服务类型
 */
export async function checkTextModeration(
  content: string,
  service: ModerationService = 'query_security_check',
): Promise<ModerationResult> {
  const result = await callAliyunApi('MultiModalGuard', {
    Service: service,
    ServiceParameters: {
      content,
    },
  });

  if (result.Code === 200) {
    const data = result.Data || {};
    const firstDetail = data.Detail?.[0];
    const firstResult = firstDetail?.Result?.[0];

    return {
      passed: data.Suggestion === 'pass',
      suggestion: data.Suggestion || 'error',
      label: firstResult?.Label || null,
      description: firstResult?.Description || null,
      detail: data.Detail || [],
    };
  }

  // API 调用失败，出于安全考虑默认拦截
  return {
    passed: false,
    suggestion: 'error',
    label: 'api_error',
    description: result.Message || '审核服务调用失败',
    detail: [],
  };
}

/**
 * 测试阿里云 API 连通性（在管理后台用来测试配置是否正确）
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const result = await callAliyunApi('MultiModalGuard', {
      Service: 'query_security_check',
      ServiceParameters: { content: 'test' },
    });
    if (result.Code === 200) {
      return { success: true, message: `连接成功，审核结果：${result.Data?.Suggestion || 'unknown'}` };
    }
    return { success: false, message: result.Message || `错误码：${result.Code}` };
  } catch (err: any) {
    return { success: false, message: err.message || '连接失败' };
  }
}
