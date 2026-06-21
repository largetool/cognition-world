// ============================================
// 阿里云 AI 安全护栏（Guardrails）审核客户端
// API: MultiModalGuard（RPC 风格，V2 HMAC-SHA1 签名）
// 文档: https://help.aliyun.com/zh/document_detail/2932956.html
// 签名规范: https://help.aliyun.com/zh/sdk/product-overview/v2-request-structure
// 版本: v2.0 - 2026-06-21
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

/**
 * 阿里云 OpenAPI V2 RPC 签名（百分号编码）
 * 文档: https://help.aliyun.com/zh/sdk/product-overview/v2-request-structure
 */
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/\+/g, '%20')
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~');
}

/**
 * 调用 MultiModalGuard API（V2 RPC 风格，表单编码请求体）
 * 参数说明：
 * - Action: MultiModalGuard
 * - Version: 2022-03-02
 * - Service: query_security_check / query_security_check_pro
 * - ServiceParameters: JSON 字符串（必须 stringify）
 * - 认证参数：AccessKeyId, Timestamp, SignatureMethod, SignatureNonce, SignatureVersion, Format
 */
async function callAliyunApi(service: string, serviceParams: Record<string, any>): Promise<any> {
  const { keyId, keySecret } = getAccessKey();
  if (!keyId || !keySecret) {
    throw new Error('阿里云 AccessKey 未配置（请在环境变量中设置 ALIBABA_ACCESS_KEY_ID 和 ALIBABA_ACCESS_KEY_SECRET）');
  }

  const date = new Date();
  // Timestamp 格式: yyyy-MM-ddTHH:mm:ssZ（ISO 8601 UTC，含连字符冒号）
  const timestamp = date.toISOString().replace(/\.\d+Z$/, 'Z');
  const nonce = crypto.randomUUID();

  // 构建参数字典（包括 API 参数和认证参数）
  const params: Record<string, string> = {
    'Action': 'MultiModalGuard',
    'Version': '2022-03-02',
    'AccessKeyId': keyId,
    'Timestamp': timestamp,
    'SignatureMethod': 'HMAC-SHA1',
    'SignatureVersion': '1.0',
    'SignatureNonce': nonce,
    'Format': 'JSON',
    'Service': service,
    'ServiceParameters': JSON.stringify(serviceParams),
  };

  // === V2 RPC 签名计算 ===

  // 1. 按参数名排序
  const sortedKeys = Object.keys(params).sort();

  // 2. 构造 CanonicalizedQueryString：percentEncode(key)=percentEncode(value)&...
  const canonicalizedQuery = sortedKeys
    .map(k => percentEncode(k) + '=' + percentEncode(params[k]))
    .join('&');

  // 3. StringToSign = HTTPMethod + "&" + percentEncode("/") + "&" + percentEncode(canonicalizedQuery)
  const stringToSign = 'POST&' + percentEncode('/') + '&' + percentEncode(canonicalizedQuery);

  // 4. Signature = Base64(HMAC-SHA1(AccessKeySecret + "&", StringToSign))
  const key = keySecret + '&';
  const signature = crypto.createHmac('sha1', key).update(stringToSign, 'utf8').digest('base64');

  // 5. 添加 Signature 到参数
  params['Signature'] = signature;

  // 6. 重新排序（Signature 参与排序后发送）
  const finalSortedKeys = Object.keys(params).sort();

  // === 发送表单编码的 POST 请求 ===
  const formBody = finalSortedKeys
    .map(k => percentEncode(k) + '=' + percentEncode(params[k]))
    .join('&');

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
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
  const result = await callAliyunApi(service, { content });

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
    const result = await callAliyunApi('query_security_check', { content: 'test' });
    if (result.Code === 200) {
      return { success: true, message: `连接成功，审核结果：${result.Data?.Suggestion || 'unknown'}` };
    }
    return { success: false, message: result.Message || `错误码：${result.Code}` };
  } catch (err: any) {
    return { success: false, message: err.message || '连接失败' };
  }
}
