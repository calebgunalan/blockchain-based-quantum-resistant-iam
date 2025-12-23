import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting stale session cleanup...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    console.log(`Cleaning up sessions older than: ${cutoffDate}`);

    // Delete stale sessions that are:
    // 1. Older than 30 days based on last_activity, OR
    // 2. Have 'Unknown' user_agent (orphaned sessions), OR
    // 3. Are marked as inactive
    const { data: staleSessions, error: fetchError } = await supabase
      .from('user_sessions')
      .select('id, user_id, last_activity, user_agent, is_active')
      .or(`last_activity.lt.${cutoffDate},user_agent.eq.Unknown,is_active.eq.false`);

    if (fetchError) {
      console.error('Error fetching stale sessions:', fetchError);
      throw fetchError;
    }

    const sessionCount = staleSessions?.length || 0;
    console.log(`Found ${sessionCount} stale sessions to clean up`);

    if (sessionCount === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No stale sessions found',
          deleted: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete the stale sessions
    const { error: deleteError } = await supabase
      .from('user_sessions')
      .delete()
      .or(`last_activity.lt.${cutoffDate},user_agent.eq.Unknown,is_active.eq.false`);

    if (deleteError) {
      console.error('Error deleting stale sessions:', deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted ${sessionCount} stale sessions`);

    // Log the cleanup action to audit logs
    try {
      await supabase.rpc('log_audit_event', {
        _action: 'CLEANUP',
        _resource: 'user_sessions',
        _resource_id: 'system',
        _details: {
          deleted_count: sessionCount,
          cutoff_date: cutoffDate,
          cleanup_type: 'stale_sessions',
          timestamp: new Date().toISOString()
        }
      });
      console.log('Audit log entry created');
    } catch (auditError) {
      console.warn('Failed to create audit log entry:', auditError);
      // Don't fail the entire operation for audit log errors
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully cleaned up ${sessionCount} stale sessions`,
        deleted: sessionCount,
        cutoff_date: cutoffDate
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Session cleanup failed:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
