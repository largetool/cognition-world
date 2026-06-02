# 密码找回功能备忘录

## 功能概述
密码找回功能允许用户通过邮箱接收重置链接来重置密码。

## 技术架构

### 1. 数据库表

#### password_resets 表
```sql
CREATE TABLE password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp without time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now()
);
```

**重要字段说明：**
- `user_id`: uuid 类型，关联 auth.users 表，**不是** profiles.user_id
- `token`: 随机生成的 UUID 令牌
- `expires_at`: 令牌过期时间（默认1小时）
- `used`: 是否已使用

### 2. Edge Functions

#### send-email (functions/send-email/index.ts)
- **用途**: 发送邮件（密码重置、欢迎邮件等）
- **部署**: `meoo-cli cloud deploy-function -n send-email`
- **API Key**: 使用 Resend API (`re_AGKs7EGY_G5tHQATbwTEwc4fgQpt61hzj`)
- **发件人**: 
  - 当前: `onboarding@resend.dev` (Resend 测试域名)
  - 正式: 需改为 `noreply@uptef.com` 并在 Resend 验证域名

**请求参数：**
```json
{
  "to": "用户邮箱",
  "subject": "邮件主题",
  "type": "password-reset",
  "resetUrl": "重置链接URL"
}
```

#### reset-password (functions/reset-password/index.ts)
- **用途**: 验证令牌并更新密码
- **部署**: `meoo-cli cloud deploy-function -n reset-password`

### 3. 前端页面

#### ForgotPasswordPage (src/pages/ForgotPasswordPage.tsx)
- **路径**: `/forgot-password`
- **流程**:
  1. 验证邮箱是否存在于 profiles 表
  2. 生成随机 token
  3. 保存到 password_resets 表
  4. 调用 send-email Edge Function 发送邮件

**关键代码：**
```typescript
// 查询 profiles 时必须包含 id 字段
const { data: profile } = await supabase
  .from('profiles')
  .select('id, user_id, email')  // id 是 uuid，用于 password_resets.user_id
  .eq('email', email)
  .maybeSingle();

// 保存令牌时使用 profile.id (uuid)，不是 profile.user_id
await supabase.from('password_resets').insert({
  user_id: profile.id,  // uuid 类型
  email: email,
  token: resetToken,
  expires_at: expiresAt,
});
```

#### ResetPasswordPage (src/pages/ResetPasswordPage.tsx)
- **路径**: `/reset-password?token=xxx`
- **流程**:
  1. 验证 token 是否有效
  2. 检查是否过期
  3. 检查是否已使用
  4. 调用 reset-password Edge Function 更新密码

## 常见问题与解决方案

### 问题1: "生成重置链接失败" - user_id 为 null
**原因**: 查询 profiles 时没选 `id` 字段，导致 `profile.id` 为 undefined
**解决**: 确保查询包含 `.select('id, user_id, email')`

### 问题2: "Missing required fields: to, subject"
**原因**: 调用 send-email 时没传 subject 参数
**解决**: 添加 `subject: '密码重置 - 认知界'`

### 问题3: "The uptef.com domain is not verified" 或 "You can only send testing emails to your own email address"
**原因**: Resend 限制
- `onboarding@resend.dev` 只能发送给注册 Resend 的邮箱（测试限制）
- 自定义域名（如 uptef.com）需要验证

**解决**:
- **测试阶段**: 只能发送给 `qq18022835@gmail.com`
- **正式方案**: 在 https://resend.com/domains 验证 uptef.com 域名

### 问题4: 邮箱未注册
**原因**: profiles 表中没有该邮箱记录
**解决**: 检查用户是否注册成功（auth.users 和 profiles 表都要有记录）

## 域名切换指南

### 从测试域名切换到正式域名

1. **修改 send-email Edge Function:**
```typescript
// 修改 from 地址
from: '认知界 <noreply@uptef.com>',
```

2. **在 Resend 验证域名:**
- 访问 https://resend.com/domains
- 添加 uptef.com 域名
- 按指引添加 DNS 记录验证

3. **重新部署 Edge Function:**
```bash
meoo-cli cloud deploy-function -n send-email
```

## 文件清单

| 文件 | 说明 |
|------|------|
| `functions/send-email/index.ts` | 邮件发送 Edge Function |
| `functions/reset-password/index.ts` | 密码重置 Edge Function |
| `src/pages/ForgotPasswordPage.tsx` | 找回密码页面 |
| `src/pages/ResetPasswordPage.tsx` | 重置密码页面 |

## 部署命令

```bash
# 部署邮件发送函数
meoo-cli cloud deploy-function -n send-email

# 部署密码重置函数
meoo-cli cloud deploy-function -n reset-password
```

## 测试账号

- 主账号: `largetool@qq.com` (一言超人)
- 小号: `largetool@sina.com` (用户2f79998b)

---
生成时间: 2026-05-31
