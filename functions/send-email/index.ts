// 邮件发送 Edge Function
// 使用 Resend API 发送邮件 + 密码重置令牌管理
// 重写版：直接通过 GoTrue Admin API 操作，不依赖 profiles 表

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface EmailRequest {
  to: string;
  subject?: string;
  html?: string;
  text?: string;
  type?: 'password-reset' | 'welcome' | 'notification';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body: EmailRequest = await req.json();
    const { to, subject, html, text, type } = body;

    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: to' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_AGKs7EGY_G5tHQATbwTEwc4fgQpt61hzj';
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // ========== 密码重置流程 ==========
    if (type === 'password-reset') {
      const sbUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseAdmin = createClient(sbUrl, serviceKey);

      // 通过 GoTrue Admin API 直接查 auth.users，不再依赖 profiles 表
      const resp = await fetch(`${sbUrl}/auth/v1/admin/users`, {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      });

      if (!resp.ok) {
        console.error('[resend-email] GoTrue API 请求失败:', resp.status);
        return new Response(
          JSON.stringify({ error: '服务异常，请稍后重试' }),
          { status: 500, headers: corsHeaders }
        );
      }

      const adminData: any = await resp.json();
      const users: any[] = adminData?.users || [];

      // 大小写不敏感匹配
      const authUser = users.find(
        (u: any) => u.email?.toLowerCase() === to.toLowerCase()
      );

      if (!authUser) {
        // 打印日志方便排查
        const emails = users.map((u: any) => u.email);
        console.log(`[resend-email] 未找到用户 ${to}。auth.users 共 ${users.length} 人: ${JSON.stringify(emails)}`);
        return new Response(
          JSON.stringify({ error: '该邮箱未注册，请检查邮箱地址' }),
          { status: 400, headers: corsHeaders }
        );
      }

      console.log(`[resend-email] 找到用户: ${authUser.email}, id: ${authUser.id}`);

      // 生成重置令牌
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // 保存到 password_resets 表（user_id 存的是 auth.users.id）
      const { data: insertData, error: tokenError } = await supabaseAdmin
        .from('password_resets')
        .insert({
          user_id: authUser.id,
          email: to,
          token: resetToken,
          expires_at: expiresAt,
        })
        .select();

      if (tokenError) {
        console.error('[resend-email] 保存 token 失败:', JSON.stringify(tokenError, null, 2));
        console.error('[resend-email] 尝试插入的数据:', JSON.stringify({ user_id: authUser.id, email: to, token: resetToken, expires_at: expiresAt }));
        return new Response(
          JSON.stringify({ error: '生成重置链接失败，请重试' }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log(`[resend-email] token 保存成功: ${JSON.stringify(insertData)}`);

      console.log(`[resend-email] token 已保存: ${resetToken.substring(0, 8)}...`);

      // 构建重置链接
      const resetUrl = `https://uptef.com/reset-password?token=${resetToken}`;

      // 发送邮件
      const emailSubject = '密码重置 - 认知界';
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">认知界</h1>
            <p style="color: #666; font-size: 14px; margin-top: 8px;">让AI认识每一个具体的普通人</p>
          </div>

          <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
            <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0;">密码重置请求</h2>
            <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
              您收到此邮件是因为您申请了密码重置。请点击下方按钮重置您的密码：
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none;
                        padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 500;">
                重置密码
              </a>
            </div>

            <p style="color: #666; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0;">
              或者复制此链接到浏览器打开：<br>
              <span style="color: #1a1a1a; word-break: break-all;">${resetUrl}</span>
            </p>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0;">
              此链接有效期为1小时，只能使用一次。如果您没有申请密码重置，请忽略此邮件。<br>
              如需要帮助，请联系管理员。
            </p>
          </div>
        </div>
      `;

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: '认知界 <noreply@uptef.com>',
          to: [to],
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      const emailResult = await emailResponse.json();

      if (!emailResponse.ok) {
        console.error('[resend-email] Resend API 错误:', emailResult);
        return new Response(
          JSON.stringify({ error: emailResult.message || '发送邮件失败' }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log(`[resend-email] 邮件已发送: ${emailResult.id}`);
      return new Response(
        JSON.stringify({
          success: true,
          messageId: emailResult.id,
          message: '重置链接已发送'
        }),
        { headers: corsHeaders }
      );
    }

    // ========== 普通邮件发送 ==========
    if (!subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: subject' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const emailContent = html || text || '';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '认知界 <noreply@uptef.com>',
        to: [to],
        subject: subject,
        html: emailContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[resend-email] Resend API 错误:', result);
      return new Response(
        JSON.stringify({ error: result.message || 'Failed to send email' }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id,
        message: 'Email sent successfully'
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[resend-email] 异常:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
