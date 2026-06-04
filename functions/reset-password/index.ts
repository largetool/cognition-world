// 密码重置 Edge Function
// 验证令牌并更新用户密码
// 重写版：直接使用 auth.users.id，不依赖 profiles 表

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ResetPasswordRequest {
  token: string;
  newPassword?: string;
  action?: 'validate' | 'reset';
}

function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };
}

function handleOptions() {
  return new Response('ok', {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

// 验证令牌，返回 { valid, userId, error? }
// userId 就是 auth.users.id，可直接用于 updateUserById
async function validateToken(supabaseAdmin: any, token: string) {
  const { data: resetRecord, error: resetError } = await supabaseAdmin
    .from('password_resets')
    .select('user_id, expires_at, used')
    .eq('token', token)
    .maybeSingle();

  if (resetError || !resetRecord) {
    return { valid: false, error: '重置链接无效，请重新申请' };
  }

  if (new Date(resetRecord.expires_at) < new Date()) {
    return { valid: false, error: '重置链接已过期，请重新申请' };
  }

  if (resetRecord.used) {
    return { valid: false, error: '重置链接已被使用，请重新申请' };
  }

  return { valid: true, userId: resetRecord.user_id };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  const corsHeaders = getCorsHeaders();

  try {
    const body: ResetPasswordRequest = await req.json();
    const { token, newPassword, action } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: token' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 仅验证令牌
    if (action === 'validate') {
      const result = await validateToken(supabaseAdmin, token);
      if (!result.valid) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: corsHeaders }
        );
      }
      return new Response(
        JSON.stringify({ valid: true, userId: result.userId }),
        { headers: corsHeaders }
      );
    }

    // 重置密码
    if (!newPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: newPassword' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: '密码长度至少6位' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 验证令牌
    const validation = await validateToken(supabaseAdmin, token);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: corsHeaders }
      );
    }

    // user_id 就是 auth.users.id，直接用
    console.log(`[reset-password] 更新密码，auth user id: ${validation.userId}`);

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      validation.userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('[reset-password] 密码更新失败:', updateError);
      return new Response(
        JSON.stringify({ error: '密码更新失败，请重试' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 标记令牌为已使用
    await supabaseAdmin
      .from('password_resets')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token);

    console.log(`[reset-password] 密码重置成功`);

    return new Response(
      JSON.stringify({ success: true, message: '密码重置成功' }),
      { headers: corsHeaders }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[reset-password] 异常:', message);
    return new Response(
      JSON.stringify({ error: '服务器错误，请重试' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
