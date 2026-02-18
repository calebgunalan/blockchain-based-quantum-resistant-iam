import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCIM_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:User";
const SCIM_LIST_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:ListResponse";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Bearer token auth
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const expectedToken = Deno.env.get('SCIM_BEARER_TOKEN');
  if (expectedToken && token !== expectedToken) {
    return new Response(JSON.stringify({ status: 401, detail: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/scim+json' }
    });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const userId = pathParts[pathParts.length - 1] !== 'Users' ? pathParts[pathParts.length - 1] : null;

  const toSCIMUser = (profile: any) => ({
    schemas: [SCIM_SCHEMA],
    id: profile.user_id,
    userName: profile.email,
    displayName: profile.full_name || profile.email,
    name: { formatted: profile.full_name || profile.email },
    emails: [{ value: profile.email, primary: true }],
    active: !profile.deleted_at,
    meta: {
      resourceType: 'User',
      created: profile.created_at,
      lastModified: profile.updated_at,
      location: `${url.origin}/scim/v2/Users/${profile.user_id}`,
    },
  });

  try {
    if (req.method === 'GET' && !userId) {
      const startIndex = parseInt(url.searchParams.get('startIndex') || '1');
      const count = parseInt(url.searchParams.get('count') || '100');
      const { data, count: total } = await supabase
        .from('profiles').select('*', { count: 'exact' })
        .is('deleted_at', null).range(startIndex - 1, startIndex + count - 2);
      return new Response(JSON.stringify({
        schemas: [SCIM_LIST_SCHEMA],
        totalResults: total || 0,
        startIndex,
        itemsPerPage: count,
        Resources: (data || []).map(toSCIMUser),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/scim+json' } });
    }

    if (req.method === 'GET' && userId) {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      if (!data) return new Response(JSON.stringify({ status: 404, detail: 'User not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/scim+json' } });
      return new Response(JSON.stringify(toSCIMUser(data)), { headers: { ...corsHeaders, 'Content-Type': 'application/scim+json' } });
    }

    if (req.method === 'PATCH' && userId) {
      const body = await req.json();
      const ops = body.Operations || [];
      const updates: Record<string, any> = {};
      for (const op of ops) {
        if (op.op === 'Replace' || op.op === 'replace') {
          if (op.path === 'displayName') updates.full_name = op.value;
          if (op.path === 'active') updates.deleted_at = op.value ? null : new Date().toISOString();
        }
      }
      const { data } = await supabase.from('profiles').update(updates).eq('user_id', userId).select().single();
      return new Response(JSON.stringify(toSCIMUser(data)), { headers: { ...corsHeaders, 'Content-Type': 'application/scim+json' } });
    }

    if (req.method === 'DELETE' && userId) {
      await supabase.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('user_id', userId);
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ status: 405, detail: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/scim+json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: 500, detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/scim+json' }
    });
  }
});
