import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // 预检请求 — CORS 必需
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);

    // ==================== 用户提交举报 ====================
    // 前端 POST 到 /functions/v1/reports → 路由根路径
    if (req.method === "POST" && (url.pathname.endsWith("/report") || url.pathname === "/" || url.pathname === "")) {
      // 验证登录
      const token = req.headers.get("authorization")?.replace("Bearer ", "") || "";
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "请先登录" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { reported_message_id, message_table, message_content, reported_user_id, reason } = await req.json();

      if (!reported_message_id || !message_table || !message_content || !reported_user_id || !reason) {
        return new Response(JSON.stringify({ error: "缺少必要信息" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (!["guestbook_messages", "user_messages", "logs", "profiles"].includes(message_table)) {
        return new Response(JSON.stringify({ error: "无效的 message_table" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (reason.length > 200) {
        return new Response(JSON.stringify({ error: "举报原因不能超过 200 字" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 查被举报用户的 UUID（前端传来的是 user_id 显示 ID → 转成 auth.users UUID）
      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("auth_user_id, user_id")
        .eq("user_id", reported_user_id)
        .maybeSingle();

      const targetUuid = targetProfile?.auth_user_id;
      if (!targetUuid) {
        return new Response(JSON.stringify({ error: "被举报用户不存在" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 不能举报自己
      if (user.id === targetUuid) {
        return new Response(JSON.stringify({ error: "不能举报自己的内容" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 同一用户不能重复举报同一条内容
      const { data: existing } = await supabaseAdmin
        .from("reports")
        .select("id")
        .eq("reporter_id", user.id)
        .eq("reported_message_id", reported_message_id)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "你已经举报过这条内容" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 每天最多举报 5 条（防滥用）
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabaseAdmin
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("reporter_id", user.id)
        .gte("created_at", `${today}T00:00:00Z`);

      if (count && count >= 5) {
        return new Response(JSON.stringify({ error: "今日举报次数已用完" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { error: insertError } = await supabaseAdmin.from("reports").insert({
        reporter_id: user.id,
        reported_message_id,
        message_table,
        message_content,
        reported_user_id: targetUuid,  // 用 UUID，不是显示 ID
        reason: reason.trim(),
      });

      if (insertError) {
        console.error("[Reports] 插入失败:", insertError.message);
        return new Response(JSON.stringify({ error: "举报提交失败" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==================== 管理员：查看举报列表 ====================
    if (req.method === "GET" && url.pathname.endsWith("/list")) {
      const token = req.headers.get("authorization")?.replace("Bearer ", "") || "";
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "未授权" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles").select("is_admin").eq("auth_user_id", user.id).single();
      if (!profile?.is_admin) {
        return new Response(JSON.stringify({ error: "仅管理员可查看" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const statusFilter = url.searchParams.get("status") || "pending";

      const { data: reports, error } = await supabaseAdmin
        .from("reports")
        .select("*, reporter:reporter_id(username), reported:reported_user_id(username)")
        .eq("status", statusFilter)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return new Response(JSON.stringify({ reports: reports || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==================== 管理员：审核举报 ====================
    if (req.method === "POST" && url.pathname.endsWith("/review")) {
      const { reportId, status, notes, freezeUser } = await req.json();

      if (!reportId || !["confirmed", "dismissed"].includes(status)) {
        return new Response(JSON.stringify({ error: "参数错误" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const token = req.headers.get("authorization")?.replace("Bearer ", "") || "";
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "未授权" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: adminProfile } = await supabaseAdmin
        .from("profiles").select("is_admin").eq("auth_user_id", user.id).single();
      if (!adminProfile?.is_admin) {
        return new Response(JSON.stringify({ error: "仅管理员可审核" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 更新举报状态
      await supabaseAdmin.from("reports").update({
        status,
        admin_notes: notes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      }).eq("id", reportId);

      // 确认违规时，如果需要，冻结被举报者
      if (status === "confirmed" && freezeUser) {
        const { data: report } = await supabaseAdmin
          .from("reports")
          .select("reported_user_id")
          .eq("id", reportId)
          .single();

        if (report) {
          await supabaseAdmin.from("profiles").update({
            is_frozen: true,
            frozen_at: new Date().toISOString(),
            frozen_reason: `举报确认：${notes || "违规内容"}`,
            frozen_by: user.id,
          }).eq("auth_user_id", report.reported_user_id);
        }
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
