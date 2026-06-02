// 邮件发送 Edge Function
// 使用 Resend API 发送邮件

interface EmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  type?: 'password-reset' | 'welcome' | 'notification';
  resetUrl?: string;
}

Deno.serve(async (req) => {
  // CORS 预检
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
    const { to, subject, html, text, type, resetUrl } = body;

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 获取 Resend API Key（优先从环境变量读取，否则使用硬编码）
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_AGKs7EGY_G5tHQATbwTEwc4fgQpt61hzj';
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 根据邮件类型生成内容
    let emailContent = html || text || '';
    let emailSubject = subject;

    if (type === 'password-reset' && resetUrl) {
      emailSubject = '密码重置 - 认知界';
      emailContent = `
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
    }

    // 调用 Resend API 发送邮件
    // 注意：使用 Resend 提供的测试域名，如需使用自定义域名请在 resend.com 验证
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [to],
        subject: emailSubject,
        html: emailContent,
        text: text || emailContent.replace(/<[^>]*>/g, ''),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
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
    console.error('Send email error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
