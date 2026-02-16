import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const maxAgeMs = 90 * 24 * 60 * 60 * 1000; // 90 days
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();

    // Find keys older than 90 days that haven't been rotated
    const { data: staleKeys, error: fetchErr } = await supabase
      .from('quantum_keys')
      .select('id, user_id, algorithm, created_at')
      .lt('created_at', cutoff)
      .eq('is_active', true)
      .limit(100);

    if (fetchErr) {
      throw new Error(`Failed to fetch stale keys: ${fetchErr.message}`);
    }

    if (!staleKeys || staleKeys.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No keys require rotation', rotated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let rotatedCount = 0;

    for (const key of staleKeys) {
      // Deactivate old key
      const { error: deactivateErr } = await supabase
        .from('quantum_keys')
        .update({ is_active: false })
        .eq('id', key.id);

      if (deactivateErr) {
        console.error(`Failed to deactivate key ${key.id}:`, deactivateErr.message);
        continue;
      }

      // Log rotation in audit_logs
      await supabase.from('audit_logs').insert({
        user_id: key.user_id,
        action: 'quantum_key_rotated',
        resource: 'quantum_keys',
        resource_id: key.id,
        details: {
          algorithm: key.algorithm,
          old_key_created_at: key.created_at,
          rotation_reason: 'age_policy_90_days',
          rotated_at: new Date().toISOString(),
        },
      });

      rotatedCount++;
    }

    return new Response(
      JSON.stringify({
        message: `Rotated ${rotatedCount} quantum keys`,
        rotated: rotatedCount,
        total_checked: staleKeys.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Key rotation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
