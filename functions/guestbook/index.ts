import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

// ============================================
// 内容安全审核（内联版本）
// ============================================
const BLOCKED_WORDS = [
  "赌博", "赌场", "博彩", "色情", "裸聊", "一夜情",
  "毒品", "摇头丸", "冰毒", "海洛因",
  "枪支", "弹药", "爆炸物",
  "代购", "刷单", "水军", "刷分",
  "加微信", "加v信", "加qq", "扫码加",
  "兼职日结", "工资日结",
];

function normalizeText(text: string): string {
  return text
    .replace(/[0-9]+/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

async function reviewText(
  text: string,
  _type: 'slogan' | 'thought' | 'guestbook' | 'profile' | 'username'
): Promise<{ pass: boolean; reason?: string }> {
  if (!text || text.trim().length === 0) {
    return { pass: false, reason: "内容不能为空" };
  }

  const normalized = normalizeText(text);

  for (const word of BLOCKED_WORDS) {
    if (normalized.includes(word)) {
      return { pass: false, reason: "内容包含违规信息，请修改后重试" };
    }
  }

  return { pass: true };
}
// ============================================

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

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // 管理员客户端（绕过 RLS）
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 用户客户端（遵守 RLS）
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    // GET /guestbook - 获取留言列表
    if (req.method === 'GET' && path === '/guestbook') {
      const { data: messages, error } = await supabaseAdmin
        .from('guestbook_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(`获取留言失败: ${error.message}`);
      }

      return new Response(JSON.stringify({ success: true, data: messages }), {
        headers: corsHeaders,
      });
    }

    // POST /guestbook - 提交留言
    if (req.method === 'POST' && path === '/guestbook') {
      const body = await req.json();
      const { content } = body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: '留言内容不能为空' }),
          { status: 400, headers: corsHeaders }
        );
      }

      if (content.length > 1000) {
        return new Response(
          JSON.stringify({ success: false, error: '留言内容不能超过1000字' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // 获取当前用户
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: '请先登录' }),
          { status: 401, headers: corsHeaders }
        );
      }

      // 检查用户注册时间是否超过3天
      const createdAt = new Date(user.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 3) {
        const remainingDays = 3 - diffDays;
        return new Response(
          JSON.stringify({
            success: false,
            error: `您的账户注册时间不足3天，还需等待 ${remainingDays} 天才能使用留言板功能`,
            remainingDays,
          }),
          { status: 403, headers: corsHeaders }
        );
      }

      // 检查24小时内留言数量限制（最多3条）
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { data: recentMessages, error: countError } = await supabaseAdmin
        .from('guestbook_messages')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo.toISOString());

      if (countError) {
        throw new Error('检查留言数量失败');
      }

      const messageCount = recentMessages?.length || 0;
      if (messageCount >= 3) {
        return new Response(
          JSON.stringify({
            success: false,
            error: '您已达到24小时留言上限（3条），请明天再试',
            limitReached: true,
            remainingCount: 0,
          }),
          { status: 429, headers: corsHeaders }
        );
      }

      // 内容安全审核
      const review = await reviewText(content.trim(), 'guestbook');
      if (!review.pass) {
        return new Response(
          JSON.stringify({ success: false, error: review.reason || '内容未通过审核' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // 获取用户资料并检查冻结状态
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('username, is_frozen')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('获取用户资料失败');
      }

      // 检查用户是否被冻结
      if (profile.is_frozen) {
        return new Response(
          JSON.stringify({ success: false, error: '您的账户已被冻结，无法发送留言' }),
          { status: 403, headers: corsHeaders }
        );
      }

      // 插入留言
      const { data: message, error: insertError } = await supabaseAdmin
        .from('guestbook_messages')
        .insert({
          user_id: user.id,
          username: profile.username,
          content: content.trim(),
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`提交留言失败: ${insertError.message}`);
      }

      return new Response(JSON.stringify({ success: true, data: message }), {
        headers: corsHeaders,
      });
    }

    // POST /guestbook/check-eligibility - 检查用户是否有资格留言
    if (req.method === 'POST' && path === '/guestbook/check-eligibility') {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: '请先登录', eligible: false }),
          { status: 401, headers: corsHeaders }
        );
      }

      const createdAt = new Date(user.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const eligible = diffDays >= 3;

      // 计算24小时内已发送的留言数量
      let remainingCount = 3;
      if (eligible) {
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const { data: recentMessages, error: countError } = await supabaseAdmin
          .from('guestbook_messages')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', twentyFourHoursAgo.toISOString());

        if (!countError && recentMessages) {
          remainingCount = Math.max(0, 3 - recentMessages.length);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          eligible,
          registeredDays: diffDays,
          remainingDays: eligible ? 0 : 3 - diffDays,
          remainingCount,
          limitReached: remainingCount === 0,
        }),
        { headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: '无效的请求' }),
      { status: 404, headers: corsHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
