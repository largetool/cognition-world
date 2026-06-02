import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// 内容安全审核（内联版本，避免共享模块部署问题）
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const url = new URL(req.url);

    // === 检查全局开关 ===
    const checkEnabled = async () => {
      const { data } = await supabaseAdmin
        .from("system_config").select("value").eq("key", "user_guestbook_enabled").single();
      return data?.value === "true";
    };

    // =====================
    // GET /conversations?userId=xxx
    // 获取用户的所有对话列表（收到 + 发出），公开可读
    // =====================
    if (req.method === "GET" && url.pathname.endsWith("/conversations")) {
      const userId = url.searchParams.get("userId");
      if (!userId) {
        return new Response(JSON.stringify({ error: "缺少 userId" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const enabled = await checkEnabled();
      if (!enabled) {
        return new Response(JSON.stringify({ conversations: [], disabled: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 收到的留言：user_b = userId
      const { data: received } = await supabaseAdmin
        .from("user_conversations")
        .select("*, user_messages(id, sender_id, sender_username, content, created_at)")
        .eq("user_b", userId)
        .order("last_message_at", { ascending: false })
        .limit(30);

      // 发出的留言：user_a = userId
      const { data: sent } = await supabaseAdmin
        .from("user_conversations")
        .select("*, user_messages(id, sender_id, sender_username, content, created_at)")
        .eq("user_a", userId)
        .order("last_message_at", { ascending: false })
        .limit(30);

      return new Response(JSON.stringify({
        received: received || [],
        sent: sent || [],
        disabled: false
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // =====================
    // GET /messages?conversationId=xxx
    // 获取某个对话的所有消息，公开可读
    // =====================
    if (req.method === "GET" && url.pathname.endsWith("/messages")) {
      const conversationId = url.searchParams.get("conversationId");
      if (!conversationId) {
        return new Response(JSON.stringify({ error: "缺少 conversationId" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data, error } = await supabaseAdmin
        .from("user_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      return new Response(JSON.stringify({ messages: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // =====================
    // POST /send
    // 发送一条留言（创建或追加到已有对话）
    // =====================
    if (req.method === "POST" && url.pathname.endsWith("/send")) {
      const { toUserId, content } = await req.json();

      // 验证
      if (!toUserId || !content || content.trim().length === 0 || content.length > 500) {
        return new Response(JSON.stringify({ error: "内容不能为空且不超过500字" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 登录验证
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "请先登录" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 不能给自己发
      if (user.id === toUserId) {
        return new Response(JSON.stringify({ error: "不能给自己留言" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 检查全局开关
      const enabled = await checkEnabled();
      if (!enabled) {
        return new Response(JSON.stringify({ error: "用户间留言板暂未开放" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 获取用户资料并检查冻结状态
      const { data: profile } = await supabaseAdmin
        .from("profiles").select("created_at, is_frozen").eq("user_id", user.id).single();

      // 检查用户是否被冻结
      if (profile?.is_frozen) {
        return new Response(JSON.stringify({ error: "您的账户已被冻结，无法发送留言" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (profile) {
        const days = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000);
        if (days < 3) {
          return new Response(JSON.stringify({
            error: `注册满3天后才能留言（还需等待 ${3 - days} 天）`
          }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      // 每日限制（5条/24h，防止刷屏）
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
      const { count } = await supabaseAdmin
        .from("user_messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", user.id)
        .gte("created_at", oneDayAgo);
      if (count && count >= 5) {
        return new Response(JSON.stringify({ error: "今日留言次数已用完" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 内容安全审核
      const review = await reviewText(content.trim(), 'guestbook');
      if (!review.pass) {
        return new Response(JSON.stringify({ error: review.reason || "内容未通过审核" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 获取发送者用户名
      const { data: senderProfile } = await supabaseAdmin
        .from("profiles").select("username").eq("id", user.id).single();
      const fromUsername = senderProfile?.username || "匿名用户";

      // 查找或创建对话（保证 user_a < user_b，UUID 字符串比较即可）
      const [smaller, larger] = [user.id, toUserId].sort();
      
      let { data: conversation } = await supabaseAdmin
        .from("user_conversations")
        .select("id")
        .eq("user_a", smaller)
        .eq("user_b", larger)
        .single();

      if (!conversation) {
        const { data: newConv, error: convError } = await supabaseAdmin
          .from("user_conversations")
          .insert({ user_a: smaller, user_b: larger, last_message_at: new Date().toISOString() })
          .select("id")
          .single();
        if (convError) throw convError;
        conversation = newConv;
      } else {
        // 更新最后消息时间
        await supabaseAdmin
          .from("user_conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversation.id);
      }

      // 插入消息
      const { data: message, error: insertError } = await supabaseAdmin
        .from("user_messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_username: fromUsername,
          content: content.trim(),
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return new Response(JSON.stringify({ success: true, message, conversationId: conversation.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // =====================
    // DELETE /delete?messageId=xxx
    // 删除自己的消息（10分钟内）或管理员删除任意
    // =====================
    if (req.method === "DELETE" && url.pathname.endsWith("/delete")) {
      const messageId = url.searchParams.get("messageId");
      if (!messageId) {
        return new Response(JSON.stringify({ error: "缺少 messageId" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "请先登录" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { error: deleteError } = await supabaseAdmin
        .from("user_messages")
        .update({ is_deleted: true })
        .eq("id", messageId)
        .eq("sender_id", user.id)
        .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());

      if (deleteError) {
        return new Response(JSON.stringify({ error: "删除失败，可能已超过10分钟" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "未知请求" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
