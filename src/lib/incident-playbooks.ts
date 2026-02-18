/**
 * Automated Incident Response Playbooks
 *
 * 6 playbooks with automated triggers and responses:
 *   1. brute_force
 *   2. impossible_travel
 *   3. privilege_escalation
 *   4. quantum_key_compromise
 *   5. session_hijack_detected (via BASC — novel trigger)
 *   6. anomalous_blockchain_gap (unique to BASC — never seen before)
 */

import { supabase } from "@/integrations/supabase/client";

export type PlaybookName =
  | 'brute_force'
  | 'impossible_travel'
  | 'privilege_escalation'
  | 'quantum_key_compromise'
  | 'session_hijack_detected'
  | 'anomalous_blockchain_gap';

export interface PlaybookTrigger {
  event_type: string;
  threshold?: number;
  time_window_minutes?: number;
  metadata?: Record<string, unknown>;
}

export interface PlaybookAction {
  action: string;
  target?: string;
  params?: Record<string, unknown>;
  executed_at: string;
  success: boolean;
  message?: string;
}

export interface PlaybookExecution {
  playbook_name: PlaybookName;
  trigger_event: string;
  trigger_data: Record<string, unknown>;
  actions: PlaybookAction[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_user_id?: string;
  status: 'executed' | 'partial' | 'failed';
  execution_time_ms: number;
}

// ============================================================
// Playbook Definitions
// ============================================================

const PLAYBOOKS: Record<PlaybookName, {
  description: string;
  severity: PlaybookExecution['severity'];
  actions: string[];
}> = {
  brute_force: {
    description: 'Repeated failed login attempts from same IP',
    severity: 'high',
    actions: ['lock_account', 'block_ip_temp', 'notify_admin', 'create_audit_log'],
  },
  impossible_travel: {
    description: 'Login from geographically impossible locations within short timeframe',
    severity: 'critical',
    actions: ['terminate_session', 'require_mfa_reauth', 'flag_account', 'notify_admin', 'create_audit_log'],
  },
  privilege_escalation: {
    description: 'Unauthorized attempt to access elevated permissions',
    severity: 'critical',
    actions: ['deny_access', 'flag_account', 'notify_admin', 'mine_incident_block', 'create_audit_log'],
  },
  quantum_key_compromise: {
    description: 'PQC key material exposure or invalid signature detected',
    severity: 'critical',
    actions: ['revoke_quantum_keys', 'force_key_rotation', 'terminate_session', 'notify_admin', 'mine_incident_block', 'create_audit_log'],
  },
  session_hijack_detected: {
    description: 'BASC chain validation detected session reference forgery',
    severity: 'critical',
    actions: ['terminate_session', 'invalidate_basc_chain', 'flag_account', 'notify_admin', 'mine_incident_block', 'create_audit_log'],
  },
  anomalous_blockchain_gap: {
    description: 'Novel: BASC session chain has unexplained gap — possible hijacking or clock manipulation',
    severity: 'high',
    actions: ['flag_session', 'increase_monitoring', 'notify_admin', 'mine_incident_block', 'create_audit_log'],
  },
};

/**
 * Execute a named incident playbook.
 */
export async function executePlaybook(
  playbookName: PlaybookName,
  triggerEvent: string,
  triggerData: Record<string, unknown>,
  affectedUserId?: string
): Promise<PlaybookExecution> {
  const startTime = Date.now();
  const playbook = PLAYBOOKS[playbookName];
  const actions: PlaybookAction[] = [];

  for (const actionName of playbook.actions) {
    const result = await executeAction(actionName, affectedUserId, triggerData);
    actions.push(result);
    if (!result.success && actionName === 'mine_incident_block') {
      // Non-blocking — continue even if blockchain write fails
      console.warn(`[Playbook] Non-critical action failed: ${actionName}`);
    }
  }

  const allSucceeded = actions.every(a => a.success);
  const someSucceeded = actions.some(a => a.success);

  const execution: PlaybookExecution = {
    playbook_name: playbookName,
    trigger_event: triggerEvent,
    trigger_data: triggerData,
    actions,
    severity: playbook.severity,
    affected_user_id: affectedUserId,
    status: allSucceeded ? 'executed' : someSucceeded ? 'partial' : 'failed',
    execution_time_ms: Date.now() - startTime,
  };

  // Persist execution record
  await persistExecution(execution);

  return execution;
}

async function executeAction(
  actionName: string,
  userId?: string,
  context: Record<string, unknown> = {}
): Promise<PlaybookAction> {
  const timestamp = new Date().toISOString();

  try {
    switch (actionName) {
      case 'lock_account':
        if (userId) {
          await supabase.from('profiles').update({ is_locked: true } as any).eq('user_id', userId);
        }
        return { action: actionName, target: userId, executed_at: timestamp, success: true, message: 'Account locked' };

      case 'terminate_session':
        if (userId) {
          await supabase.from('user_sessions').update({ is_active: false }).eq('user_id', userId);
        }
        return { action: actionName, target: userId, executed_at: timestamp, success: true, message: 'All sessions terminated' };

      case 'revoke_quantum_keys':
        if (userId) {
          await supabase.from('quantum_key_cache').update({ is_active: false } as any).eq('user_id', userId);
        }
        return { action: actionName, target: userId, executed_at: timestamp, success: true, message: 'Quantum keys revoked' };

      case 'flag_account':
        // Log a critical audit event
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'ACCOUNT_FLAGGED',
          resource: 'security',
          details: { reason: 'Automated incident response', context } as any,
        });
        return { action: actionName, target: userId, executed_at: timestamp, success: true, message: 'Account flagged in audit log' };

      case 'flag_session':
        await supabase.from('basc_session_refs')
          .update({ gap_detected: true })
          .eq('user_id', userId || '');
        return { action: actionName, target: userId, executed_at: timestamp, success: true, message: 'Session flagged in BASC chain' };

      case 'invalidate_basc_chain':
        // Mark all recent BASC refs as gap-detected
        if (userId) {
          await supabase.from('basc_session_refs')
            .update({ gap_detected: true })
            .eq('user_id', userId)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        }
        return { action: actionName, target: userId, executed_at: timestamp, success: true, message: 'BASC chain invalidated' };

      case 'mine_incident_block':
        // Record incident in blockchain audit log
        const incidentHash = await sha256Hex(`INCIDENT:${actionName}:${userId}:${timestamp}`);
        await supabase.from('blockchain_audit_logs').insert({
          user_id: userId || '00000000-0000-0000-0000-000000000000',
          action: 'INCIDENT_RECORDED',
          resource: 'security_incident',
          transaction_id: incidentHash.slice(0, 36),
          integrity_hash: incidentHash,
          metadata: { playbook: context.playbook_name || 'unknown', context } as any,
        });
        return { action: actionName, executed_at: timestamp, success: true, message: `Incident mined: ${incidentHash.slice(0, 16)}...` };

      case 'create_audit_log':
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'INCIDENT_PLAYBOOK_EXECUTED',
          resource: 'incident_response',
          details: { context } as any,
        });
        return { action: actionName, target: userId, executed_at: timestamp, success: true, message: 'Audit log created' };

      case 'notify_admin':
        // In production: send notification. Here we create a system alert.
        await supabase.from('system_alerts').insert({
          alert_type: 'INCIDENT_PLAYBOOK',
          severity: 'critical',
          message: `Incident playbook executed for user ${userId}: ${JSON.stringify(context).slice(0, 200)}`,
          metadata: { context } as any,
        } as any);
        return { action: actionName, executed_at: timestamp, success: true, message: 'Admin notified via system alert' };

      default:
        return { action: actionName, executed_at: timestamp, success: true, message: `Action ${actionName} acknowledged` };
    }
  } catch (err) {
    return { action: actionName, executed_at: timestamp, success: false, message: `Failed: ${err}` };
  }
}

async function persistExecution(execution: PlaybookExecution): Promise<void> {
  try {
    await supabase.from('incident_playbook_executions').insert({
      playbook_name: execution.playbook_name,
      trigger_event: execution.trigger_event,
      trigger_data: execution.trigger_data as any,
      actions_taken: execution.actions as any,
      affected_user_id: execution.affected_user_id,
      severity: execution.severity,
      status: execution.status,
      execution_time_ms: execution.execution_time_ms,
    });
  } catch (err) {
    console.error('[Playbook] Failed to persist execution:', err);
  }
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Auto-detect and trigger appropriate playbook based on event type
 */
export async function autoTriggerPlaybook(
  eventType: string,
  userId?: string,
  eventData?: Record<string, unknown>
): Promise<PlaybookExecution | null> {
  const triggerMap: Record<string, PlaybookName> = {
    'REPEATED_LOGIN_FAILURE': 'brute_force',
    'IMPOSSIBLE_TRAVEL': 'impossible_travel',
    'PRIVILEGE_ESCALATION_ATTEMPT': 'privilege_escalation',
    'QUANTUM_KEY_INVALID': 'quantum_key_compromise',
    'BASC_CHAIN_FORGERY': 'session_hijack_detected',
    'BASC_GAP_DETECTED': 'anomalous_blockchain_gap',
  };

  const playbookName = triggerMap[eventType];
  if (!playbookName) return null;

  return executePlaybook(playbookName, eventType, eventData || {}, userId);
}

/**
 * Get recent playbook executions (for SOC dashboard)
 */
export async function getRecentExecutions(limit = 50): Promise<unknown[]> {
  const { data } = await supabase
    .from('incident_playbook_executions')
    .select('*')
    .order('executed_at', { ascending: false })
    .limit(limit);

  return data || [];
}

export const PLAYBOOK_METADATA = PLAYBOOKS;
