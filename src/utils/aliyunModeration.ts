// ============================================
// 阿里云 AI 安全护栏（Guardrails）审核客户端
// API: MultiModalGuard
// 文档: https://help.aliyun.com/zh/icp-filing/basic-icp-service/product-overview/...
// 版本: v1.0 - 2026-06-11
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
 * 调用阿里云 OpenAPI Signature v3（ACS3-HMAC-SHA256）
 * 文档: https://www.alibabacloud.com/help/en/sdk/product-overview/v3-request-structure-and-signature
 */
async function callAliyunApi(action: string, body: Record<string, any>): Promise<any> {
  const { keyId, keySecret } = getAccessKey();
  if (!keyId || !keySecret) {
    throw new Error('阿里云 AccessKey 未配置（请在环境变量中设置 ALIBABA_ACCESS_KEY_ID 和 ALIBABA_ACCESS_KEY_SECRET）');
  }

  const bodyStr = JSON.stringify(body);
  const date = new Date();
  // x-acs-date: ISO 8601 UTC, 格式 yyyy-MM-ddTHH:mm:ssZ
  const requestDate = date.toISOString().replace(/\.\d+Z$/, 'Z');
  // credential 中用的日期: YYYYMMDD
  const dateStr = date.toISOString().replace(/[:\-]/g, '').substring(0, 8);
  const nonce = crypto.randomUUID();
  const algorithm = 'ACS3-HMAC-SHA256';
  const host = 'green-cip.cn-shanghai.aliyuncs.com';

  // Body SHA256
  const payloadHash = crypto.createHash('sha256').update(bodyStr, 'utf8').digest('hex');

  // === 1. 参与签名的请求头 ===
  // 只包含 SignedHeaders 列表中的头（官方示例：不包含 Content-Type）
  const signedHeaderMap: Record<string, string> = {
    'host': host,
    'x-acs-action': action,
    'x-acs-content-sha256': payloadHash,
    'x-acs-date': requestDate,
    'x-acs-signature-nonce': nonce,
    'x-acs-version': '2022-03-02',
  };
  const signedHeaderKeys = Object.keys(signedHeaderMap); // 已按字母排好

  // 2. CanonicalHeaders
  const canonicalHeaders = signedHeaderKeys
    .map(k => `${k}:${signedHeaderMap[k].trim()}`)
    .join('\n') + '\n';

  // 3. SignedHeaders
  const signedHeaders = signedHeaderKeys.join(';');

  // 4. CanonicalRequest
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  // 5. StringToSign = Algorithm + "\n" + HexEncode(SHA256(CanonicalRequest))
  const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex');
  const stringToSign = `${algorithm}\n${canonicalRequestHash}`;

  // 6. Signature
  const signature = crypto.createHmac('sha256', keySecret).update(stringToSign, 'utf8').digest('hex');

  // 7. Authorization
  const credential = `${keyId}/${dateStr}/${REGION}/${SERVICE}/aliyun_v4_request`;
  const authorization = `${algorithm} Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // === 发送请求 ===
  // 实际 HTTP 请求头（Host 保持标准大写，其他用 x-acs- 前缀）
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Host': host,
      'Content-Type': 'application/json',
      'X-Acs-Action': action,
      'X-Acs-Version': '2022-03-02',
      'X-Acs-Content-Sha256': payloadHash,
      'X-Acs-Date': requestDate,
      'X-Acs-Signature-Nonce': nonce,
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
