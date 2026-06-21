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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);

    // ==================== 用户提交举报 ====================
    // 前端 POST 到 /functions/v1/reports → 路由根路径
    if (req.method === "POST" && (url.pathname.endsWith("/reports") || url.pathname.endsWith("/report") || url.pathname === "/" || url.pathname === "")) {
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

      // 用用户 JWT + anon key 创建客户端（依赖 RLS 策略控制权限）
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      });

      // 验证用户身份
      const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
      if (authError || !user) {
        console.error("[Reports] 鉴权失败:", authError?.message || "无用户");
        return new Response(JSON.stringify({ error: "未授权" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const statusFilter = url.searchParams.get("status") || "pending";

      // 查询举报列表（RLS 策略会限制仅管理员可查看）
      console.log("[Reports] 查询举报列表, status:", statusFilter);
      const { data: reports, error: reportsError } = await supabaseUser
        .from("reports")
        .select("*")
        .eq("status", statusFilter)
        .order("created_at", { ascending: false })
        .limit(100);

      if (reportsError) {
        console.error("[Reports] 查询举报列表失败:", reportsError);
        return new Response(JSON.stringify({ error: `查询失败: ${reportsError.message || JSON.stringify(reportsError)}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log("[Reports] 查询到举报数:", reports?.length || 0);

      // 收集所有涉及的 user_id
      const userIds = new Set<string>();
      for (const r of reports || []) {
        if (r.reporter_id) userIds.add(r.reporter_id);
        if (r.reported_user_id) userIds.add(r.reported_user_id);
      }

      // 建两个 map：user_id → username 和 auth_user_id → username
      const profileByUserId = new Map<string, string>();
      const profileByAuthUuid = new Map<string, string>();
      if (userIds.size > 0) {
        console.log("[Reports] 查询 profiles, userIds:", [...userIds]);

        // 查询所有 profiles，用 user_id 过滤
        const { data: profiles, error: profilesError } = await supabaseUser
          .from("profiles")
          .select("user_id, auth_user_id, username")
          .in("user_id", [...userIds]);

        if (profilesError) {
          console.error("[Reports] 查询 profiles 失败:", profilesError);
          return new Response(JSON.stringify({ error: `查询 profiles 失败: ${profilesError.message || JSON.stringify(profilesError)}` }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        console.log("[Reports] profiles 匹配数:", profiles?.length || 0);

        for (const p of profiles || []) {
          if (p.user_id) profileByUserId.set(p.user_id, p.username);
          if (p.auth_user_id) profileByAuthUuid.set(p.auth_user_id, p.username);
        }

        // 如果某些 user_id 没匹配到，可能存的是 auth UUID，再查一次
        const unmatchedIds = [...userIds].filter(
          (id) => !profileByUserId.has(id) && !profileByAuthUuid.has(id)
        );
        console.log("[Reports] 未匹配 IDs:", unmatchedIds);
        if (unmatchedIds.length > 0) {
          const { data: extraProfiles, error: extraError } = await supabaseUser
            .from("profiles")
            .select("user_id, auth_user_id, username")
            .in("auth_user_id", unmatchedIds);

          if (extraError) {
            console.error("[Reports] 二次查询 profiles 失败:", extraError);
          } else {
            for (const p of extraProfiles || []) {
              if (p.user_id) profileByUserId.set(p.user_id, p.username);
              if (p.auth_user_id) profileByAuthUuid.set(p.auth_user_id, p.username);
            }
          }
        }
      }

      // 组装返回数据
      const enriched = (reports || []).map((r) => ({
        ...r,
        reporter_username:
          profileByUserId.get(r.reporter_id) ||
          profileByAuthUuid.get(r.reporter_id) ||
          "未知",
        reported_username:
          profileByUserId.get(r.reported_user_id) ||
          profileByAuthUuid.get(r.reported_user_id) ||
          "未知",
      }));

      console.log("[Reports] 返回数据条数:", enriched.length);
      return new Response(JSON.stringify({ reports: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==================== 管理员：审核举报 ====================
    if (req.method === "POST" && url.pathname.endsWith("/review")) {
      const { reportId, status, notes } = await req.json();

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

      const { data: adminById } = await supabaseAdmin
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      const { data: adminByAuthId } = await supabaseAdmin
        .from("profiles")
        .select("is_admin")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      const adminProfile = adminById || adminByAuthId;
      if (!adminProfile?.is_admin) {
        return new Response(JSON.stringify({ error: "仅管理员可审核" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 获取完整举报信息
      const { data: report } = await supabaseAdmin
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (!report) {
        return new Response(JSON.stringify({ error: "举报记录不存在" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 更新举报状态
      await supabaseAdmin.from("reports").update({
        status,
        admin_notes: notes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      }).eq("id", reportId);

      // 确认违规：隐藏内容 + 发通知
      if (status === "confirmed") {
        // 根据 message_table 隐藏对应内容
        const hideReason = notes || report.reason;
        if (report.message_table === "logs") {
          await supabaseAdmin.from("logs").update({
            is_hidden: true,
            violation_reason: hideReason,
          }).eq("id", report.reported_message_id);
        } else if (report.message_table === "guestbook_messages") {
          await supabaseAdmin.from("guestbook_messages").update({
            is_hidden: true,
          }).eq("id", report.reported_message_id);
        }

        // 获取举报者的 username（从 reporter_id UUID 查 profiles）
        const { data: reporterProfile } = await supabaseAdmin
          .from("profiles")
          .select("username")
          .eq("auth_user_id", report.reporter_id)
          .maybeSingle();

        const reporterUsername = reporterProfile?.username || "未知用户";

        // 内容类型中文名
        const contentTypeMap: Record<string, string> = {
          logs: "认知日志",
          guestbook_messages: "留言",
          user_messages: "用户消息",
          profiles: "用户资料",
        };
        const contentTypeLabel = contentTypeMap[report.message_table] || report.message_table;

        // 发给举报者：感谢通知
        await supabaseAdmin.rpc("send_violation_notifications", {
          p_reporter_user_id: report.reporter_id,
          p_reporter_username: reporterUsername,
          p_reported_user_id: report.reported_user_id,
          p_reason: hideReason,
          p_content_type: contentTypeLabel,
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
    console.error("[Reports] 未捕获异常:", error, typeof error, error instanceof Error ? (error as Error).stack : "");
    let errorMessage = "服务器内部错误";
    try {
      errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    } catch (e) {
      errorMessage = String(error);
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
