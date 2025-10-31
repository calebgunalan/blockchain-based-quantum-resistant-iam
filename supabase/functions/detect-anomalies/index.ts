import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Periodic Background Job: Detect Behavioral Anomalies
 * Analyzes user patterns and detects suspicious behavior
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting anomaly detection...');

    // Get recent sessions (last 24 hours)
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('user_id, ip_address, created_at, user_agent')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (sessionsError) {
      throw sessionsError;
    }

    console.log(`Analyzing ${recentSessions?.length || 0} recent sessions`);

    const anomalies: any[] = [];

    // Group sessions by user
    const userSessions = new Map<string, any[]>();
    for (const session of recentSessions || []) {
      if (!userSessions.has(session.user_id)) {
        userSessions.set(session.user_id, []);
      }
      userSessions.get(session.user_id)!.push(session);
    }

    // Detect anomalies
    for (const [userId, sessions] of userSessions.entries()) {
      // Check for impossible travel (multiple IPs in short time)
      const uniqueIPs = new Set(sessions.map(s => s.ip_address));
      if (uniqueIPs.size > 5) {
        anomalies.push({
          userId,
          type: 'IMPOSSIBLE_TRAVEL',
          severity: 'high',
          details: { unique_ips: uniqueIPs.size, session_count: sessions.length }
        });
      }

      // Check for rapid session creation
      if (sessions.length > 20) {
        anomalies.push({
          userId,
          type: 'RAPID_SESSION_CREATION',
          severity: 'medium',
          details: { session_count: sessions.length, timeframe: '24h' }
        });
      }

      // Check for unusual user agent patterns
      const userAgents = sessions.map(s => s.user_agent);
      const uniqueAgents = new Set(userAgents);
      if (uniqueAgents.size > 3) {
        anomalies.push({
          userId,
          type: 'MULTIPLE_DEVICES',
          severity: 'low',
          details: { unique_agents: uniqueAgents.size }
        });
      }
    }

    console.log(`Found ${anomalies.length} anomalies`);

    // Log anomalies
    for (const anomaly of anomalies) {
      // Insert behavioral pattern
      await supabase
        .from('user_behavioral_patterns')
        .insert({
          user_id: anomaly.userId,
          pattern_type: 'anomaly_detected',
          pattern_data: anomaly.details,
          confidence_score: anomaly.severity === 'high' ? 0.9 : anomaly.severity === 'medium' ? 0.7 : 0.5
        });

      // Log attack if high severity
      if (anomaly.severity === 'high') {
        await supabase
          .from('quantum_attack_logs')
          .insert({
            attack_type: anomaly.type,
            target_user_id: anomaly.userId,
            severity: anomaly.severity,
            is_blocked: false,
            detection_method: 'behavioral_analysis',
            attack_signature: `anomaly_${anomaly.type}_${Date.now()}`,
            metadata: anomaly.details
          });
      }
    }

    // Log the analysis
    await supabase.rpc('log_audit_event', {
      _action: 'ANOMALY_DETECTION_COMPLETED',
      _resource: 'security_analysis',
      _details: {
        sessions_analyzed: recentSessions?.length || 0,
        anomalies_found: anomalies.length,
        high_severity: anomalies.filter(a => a.severity === 'high').length,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        sessions_analyzed: recentSessions?.length || 0,
        anomalies_detected: anomalies.length,
        high_severity: anomalies.filter(a => a.severity === 'high').length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in anomaly detection:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
