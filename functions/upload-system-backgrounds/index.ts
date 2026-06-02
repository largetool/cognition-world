import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { name, base64Data, contentType } = await req.json();

    if (!name || !base64Data) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('backgrounds')
      .upload(`system/${Date.now()}_${name}`, bytes, {
        contentType: contentType || 'image/jpeg',
      });

    if (uploadError) {
      return new Response(JSON.stringify({ success: false, error: uploadError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('backgrounds')
      .getPublicUrl(uploadData.path);

    const { error: dbError } = await supabaseAdmin
      .from('system_backgrounds')
      .insert({
        name: name.replace(/\.[^/.]+$/, ''),
        url: publicUrl,
        is_active: true,
      });

    if (dbError) {
      return new Response(JSON.stringify({ success: false, error: dbError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, url: publicUrl }), { headers: corsHeaders });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
