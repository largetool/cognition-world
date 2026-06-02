import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);

    // === POST /request-hide ===
    // 用户提交账户隐藏申请
    if (req.method === "POST" && url.pathname.endsWith("/request-hide")) {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
        req.headers.get("authorization")?.replace("Bearer ", "") || ""
      );
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "请先登录" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 检查是否已经被管理员冻结（管理员冻结的用户不能申请隐藏）
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("is_frozen, hide_status")
        .eq("user_id", user.id)
        .single();

      if (profile?.is_frozen) {
        return new Response(JSON.stringify({
          error: "你的账户已被平台冻结，不能申请隐藏。请先联系管理员解决。"
        }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (profile?.hide_status !== 'none') {
        return new Response(JSON.stringify({
          error: "你已经提交过隐藏申请，正在处理中。"
        }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // 争议拦截：检查是否有未解决的举报
      const { data: pendingReports } = await supabaseAdmin
        .from("reports")
        .select("id")
        .eq("reported_user_id", user.id)
        .eq("status", "pending");

      if (pendingReports && pendingReports.length > 0) {
        return new Response(JSON.stringify({
          error: "你有一项未解决的争议。在争议处理完成之前，不能隐藏账户。",
          pendingReports: pendingReports.length
        }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // 提交隐藏申请
      const now = new Date();
      const coolingEnds = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3天

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          hide_status: 'cooling',
          hide_requested_at: now.toISOString(),
          cooling_ends_at: coolingEnds.toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({
        success: true,
        message: "隐藏申请已提交。你有 3 天冷静期，期间可随时取消。3 天后账户将进入冻结期。",
        coolingEndsAt: coolingEnds.toISOString(),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === POST /cancel-hide ===
    // 用户在冷静期内取消隐藏申请
    if (req.method === "POST" && url.pathname.endsWith("/cancel-hide")) {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
        req.headers.get("authorization")?.replace("Bearer ", "") || ""
      );
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "请先登录" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("hide_status")
        .eq("user_id", user.id)
        .single();

      if (profile?.hide_status !== 'cooling') {
        return new Response(JSON.stringify({
          error: "没有可取消的隐藏申请。你可能不在冷静期内。"
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await supabaseAdmin.from("profiles").update({
        hide_status: 'none',
        hide_canceled_at: new Date().toISOString(),
        cooling_ends_at: null,
      }).eq("user_id", user.id);

      return new Response(JSON.stringify({
        success: true,
        message: "隐藏申请已取消，账户恢复正常。"
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === POST /check-and-transition ===
    // 定时检查：冷静期到期 → 自动进入冻结期
    if (req.method === "POST" && url.pathname.endsWith("/check-and-transition")) {
      const now = new Date().toISOString();

      // 冷静期到期的用户 → 进入冻结期
      const { data: coolingExpired } = await supabaseAdmin
        .from("profiles")
        .select("user_id, cooling_ends_at")
        .eq("hide_status", "cooling")
        .lte("cooling_ends_at", now);

      if (coolingExpired && coolingExpired.length > 0) {
        for (const p of coolingExpired) {
          const frozenEnds = new Date(new Date(p.cooling_ends_at).getTime() + 180 * 24 * 60 * 60 * 1000); // +6个月
          await supabaseAdmin.from("profiles").update({
            hide_status: 'frozen',
            frozen_ends_at: frozenEnds.toISOString(),
          }).eq("user_id", p.user_id);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        transitioned: coolingExpired?.length || 0
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === POST /request-restore ===
    // 冻结期满 6 个月后，用户申请恢复
    if (req.method === "POST" && url.pathname.endsWith("/request-restore")) {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
        req.headers.get("authorization")?.replace("Bearer ", "") || ""
      );
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "请先登录" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("hide_status, frozen_ends_at")
        .eq("user_id", user.id)
        .single();

      if (profile?.hide_status !== 'frozen') {
        return new Response(JSON.stringify({
          error: "你的账户不在冻结期，不需要恢复。"
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (profile.frozen_ends_at && new Date(profile.frozen_ends_at) > new Date()) {
        const daysLeft = Math.ceil((new Date(profile.frozen_ends_at).getTime() - Date.now()) / 86400000);
        return new Response(JSON.stringify({
          error: `冻结期尚未结束，还需等待 ${daysLeft} 天。`
        }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // 恢复账户
      await supabaseAdmin.from("profiles").update({
        hide_status: 'none',
        restored_at: new Date().toISOString(),
        frozen_ends_at: null,
        cooling_ends_at: null,
      }).eq("user_id", user.id);

      return new Response(JSON.stringify({
        success: true,
        message: "账户已恢复，所有历史内容重新对外显示。欢迎回来。"
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === GET /status ===
    // 查询当前用户的隐藏状态
    if (req.method === "GET" && url.pathname.endsWith("/status")) {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
        req.headers.get("authorization")?.replace("Bearer ", "") || ""
      );
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "请先登录" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("hide_status, hide_requested_at, cooling_ends_at, frozen_ends_at")
        .eq("user_id", user.id)
        .single();

      return new Response(JSON.stringify(profile || { hide_status: 'none' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "未知请求" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
