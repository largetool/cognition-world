/**
 * 根据 display_id 生成纯数字 user_id
 * 格式：9位纯数字，如 "000000003"
 */
export function generateUserId(_username: string, displayId: number): string {
  return String(displayId).padStart(9, '0');
}
