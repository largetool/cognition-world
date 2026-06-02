// 密码重置 Edge Function
// 验证令牌并更新用户密码

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
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
    const body: ResetPasswordRequest = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: token, newPassword' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 验证密码长度
    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 创建 Supabase Admin 客户端
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. 查询令牌是否有效
    const { data: resetRecord, error: resetError } = await supabaseAdmin
      .from('password_resets')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .maybeSingle();

    if (resetError || !resetRecord) {
      return new Response(
        JSON.stringify({ error: 'Invalid reset token' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. 检查是否已过期
    if (new Date(resetRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Reset token has expired' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. 检查是否已使用
    if (resetRecord.used) {
      return new Response(
        JSON.stringify({ error: 'Reset token has already been used' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. 获取用户的 auth id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', resetRecord.user_id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 5. 更新用户密码
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Update password error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 6. 标记令牌为已使用
    const { error: markError } = await supabaseAdmin
      .from('password_resets')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token);

    if (markError) {
      console.error('Mark token used error:', markError);
      // 不影响主流程，只记录错误
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset successfully' 
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Reset password error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
