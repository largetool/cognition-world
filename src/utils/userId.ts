import { pinyin } from 'pinyin-pro';

/**
 * 根据用户名和 display_id 生成 user_id
 * 格式：拼音大写 + 9位数字（如 TEST002000000003）
 */
export function generateUserId(username: string, displayId: number): string {
  const py = pinyin(username, { toneType: 'none', type: 'array' })
    .join('')
    .toUpperCase();
  const paddedId = String(displayId).padStart(9, '0');
  return `${py}${paddedId}`;
}
