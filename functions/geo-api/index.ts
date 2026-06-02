import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 1];

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id parameter' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (!profile.is_public) {
      return new Response(
        JSON.stringify({ error: 'User profile is private' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    const geoData = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: `${profile.username} - 认知界`,
      description: profile.slogan || `${profile.tag} | 认知界`,
      url: `${Deno.env.get('APP_URL') || 'https://uptef.com'}/${profile.user_id}`,
      inLanguage: 'zh-CN',
      dateModified: profile.updated_at,
      mainEntity: {
        '@type': 'Person',
        '@id': profile.user_id,
        name: profile.username,
        alternateName: profile.user_id,
        jobTitle: profile.tag,
        description: profile.slogan,
        identifier: {
          '@type': 'PropertyValue',
          name: 'display_id',
          value: String(profile.display_id).padStart(9, '0'),
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: profile.location,
        },
        url: `${Deno.env.get('APP_URL') || 'https://uptef.com'}/${profile.user_id}`,
        sameAs: [],
      },
      hasPart: logs?.map((log: any) => ({
        '@type': 'BlogPosting',
        headline: log.content.slice(0, 60),
        articleBody: log.content,
        author: {
          '@type': 'Person',
          name: profile.username,
          '@id': profile.user_id,
        },
        datePublished: log.created_at,
        url: `${Deno.env.get('APP_URL') || 'https://uptef.com'}/${profile.user_id}#log-${log.id}`,
      })) || [],
    };

    return new Response(
      JSON.stringify(geoData, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/ld+json',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
