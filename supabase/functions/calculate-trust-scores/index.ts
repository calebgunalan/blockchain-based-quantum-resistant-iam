import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Periodic Background Job: Calculate Trust Scores for All Users
 * This runs via pg_cron to update risk assessments
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting trust score calculation for all users...');

    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id')
      .is('deleted_at', null);

    if (usersError) {
      throw usersError;
    }

    console.log(`Found ${users?.length || 0} users to process`);

    let successCount = 0;
    let errorCount = 0;

    // Calculate trust score for each user
    for (const user of users || []) {
      try {
        const { data, error } = await supabase.rpc('calculate_comprehensive_risk_score', {
          _user_id: user.user_id
        });

        if (error) {
          console.error(`Error calculating score for user ${user.user_id}:`, error);
          errorCount++;
        } else {
          console.log(`Calculated score for user ${user.user_id}:`, data);
          successCount++;
        }
      } catch (err) {
        console.error(`Exception for user ${user.user_id}:`, err);
        errorCount++;
      }
    }

    // Log the batch operation
    await supabase.rpc('log_audit_event', {
      _action: 'TRUST_SCORE_BATCH_CALCULATION',
      _resource: 'quantum_threat_assessments',
      _details: {
        total_users: users?.length || 0,
        successful: successCount,
        errors: errorCount,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`Trust score calculation complete. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: users?.length || 0,
        successful: successCount,
        errors: errorCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in trust score calculation:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
