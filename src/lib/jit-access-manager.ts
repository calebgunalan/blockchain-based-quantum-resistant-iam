/**
 * Just-In-Time (JIT) Access Manager
 * Phase 3: IAM Enhancements
 * 
 * Provides temporary, time-limited access to resources with automatic expiration
 * and risk-based approval workflows
 */

import { supabase } from '@/integrations/supabase/client';
import { BlockchainIntegrationManager } from './enhanced-quantum-blockchain-integration';

// ============================================================================
// Type Definitions
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type SessionStatus = 'pending' | 'approved' | 'active' | 'expired' | 'revoked' | 'denied';

export interface JITAccessRequest {
  userId: string;
  resourceType: string;
  resourceId: string;
  accessLevel: string;
  duration: number; // in hours
  reason: string;
  requestContext?: Record<string, any>;
}

export interface JITAccessSession {
  id: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  access_level: string;
  risk_level: RiskLevel;
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
  expires_at: string;
  revoked_at?: string;
  revoked_by?: string;
  revoke_reason?: string;
  status: SessionStatus;
  request_context: Record<string, any>;
  approval_notes?: string;
  auto_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface JITAccessPolicy {
  id: string;
  resource_type: string;
  risk_level: RiskLevel;
  auto_approve: boolean;
  requires_approval: boolean;
  approver_role?: string;
  max_duration: string;
  allowed_access_levels: string[];
  policy_rules: Record<string, any>;
  is_active: boolean;
}

export interface AccessRequestResult {
  success: boolean;
  sessionId?: string;
  status: SessionStatus;
  message: string;
  expiresAt?: Date;
}

// ============================================================================
// JIT Access Manager Class
// ============================================================================

export class JITAccessManager {
  private blockchain?: BlockchainIntegrationManager;

  constructor(enableBlockchainAudit: boolean = true) {
    if (enableBlockchainAudit) {
      this.blockchain = new BlockchainIntegrationManager();
      this.blockchain.initialize().catch(console.error);
    }
  }

  /**
   * Request temporary access to a resource
   */
  async requestAccess(request: JITAccessRequest): Promise<AccessRequestResult> {
    try {
      // 1. Calculate risk level
      const riskLevel = await this.calculateRiskLevel(request);

      // 2. Get applicable policy
      const policy = await this.getPolicy(request.resourceType, riskLevel);
      if (!policy) {
        return {
          success: false,
          status: 'denied',
          message: 'No policy found for this resource type and risk level'
        };
      }

      // 3. Validate access level
      if (!policy.allowed_access_levels.includes(request.accessLevel)) {
        return {
          success: false,
          status: 'denied',
          message: `Access level '${request.accessLevel}' not allowed for this resource`
        };
      }

      // 4. Calculate expiration time
      const maxDurationHours = this.parseDuration(policy.max_duration);
      const durationHours = Math.min(request.duration, maxDurationHours);
      const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

      // 5. Create session record
      const { data: session, error } = await supabase
        .from('jit_access_sessions')
        .insert({
          user_id: request.userId,
          resource_type: request.resourceType,
          resource_id: request.resourceId,
          access_level: request.accessLevel,
          risk_level: riskLevel,
          expires_at: expiresAt.toISOString(),
          request_context: {
            ...request.requestContext,
            reason: request.reason,
            requested_duration: request.duration,
            granted_duration: durationHours
          },
          status: policy.auto_approve ? 'approved' : 'pending',
          auto_approved: policy.auto_approve,
          approved_at: policy.auto_approve ? new Date().toISOString() : undefined
        })
        .select()
        .single();

      if (error) throw error;

      // 6. Log to blockchain
      if (this.blockchain) {
        await this.blockchain.logAuditEvent(
          request.userId,
          'JIT_ACCESS_REQUEST',
          request.resourceType,
          {
            sessionId: session.id,
            resourceId: request.resourceId,
            accessLevel: request.accessLevel,
            riskLevel,
            autoApproved: policy.auto_approve,
            duration: durationHours
          }
        );
      }

      // 7. If auto-approved, activate immediately
      if (policy.auto_approve) {
        await this.activateSession(session.id);
      }

      return {
        success: true,
        sessionId: session.id,
        status: session.status as SessionStatus,
        message: policy.auto_approve
          ? `Access granted automatically until ${expiresAt.toLocaleString()}`
          : 'Access request submitted for approval',
        expiresAt
      };
    } catch (error) {
      console.error('Error requesting JIT access:', error);
      return {
        success: false,
        status: 'denied',
        message: error instanceof Error ? error.message : 'Failed to request access'
      };
    }
  }

  /**
   * Approve a pending access request
   */
  async approveAccess(
    sessionId: string,
    approverId: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { data: session, error } = await supabase
        .from('jit_access_sessions')
        .update({
          status: 'approved' as SessionStatus,
          approved_at: new Date().toISOString(),
          approved_by: approverId,
          approval_notes: notes
        })
        .eq('id', sessionId)
        .eq('status', 'pending')
        .select()
        .single() as { data: any; error: any };

      if (error) throw error;

      // Activate the session
      await this.activateSession(sessionId);

      // Log to blockchain
      if (this.blockchain) {
        await this.blockchain.logAuditEvent(
          approverId,
          'JIT_ACCESS_APPROVED',
          session.resource_type,
          {
            sessionId,
            grantedTo: session.user_id,
            resourceId: session.resource_id,
            expiresAt: session.expires_at
          }
        );
      }

      return true;
    } catch (error) {
      console.error('Error approving access:', error);
      return false;
    }
  }

  /**
   * Deny a pending access request
   */
  async denyAccess(
    sessionId: string,
    approverId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const { data: session, error } = await supabase
        .from('jit_access_sessions')
        .update({
          status: 'denied',
          revoked_by: approverId,
          revoke_reason: reason
        })
        .eq('id', sessionId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;

      // Log to blockchain
      if (this.blockchain) {
        await this.blockchain.logAuditEvent(
          approverId,
          'JIT_ACCESS_DENIED',
          session.resource_type,
          {
            sessionId,
            deniedFor: session.user_id,
            reason
          }
        );
      }

      return true;
    } catch (error) {
      console.error('Error denying access:', error);
      return false;
    }
  }

  /**
   * Revoke active access
   */
  async revokeAccess(
    sessionId: string,
    revokerId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const { data: session, error } = await supabase
        .from('jit_access_sessions')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: revokerId,
          revoke_reason: reason
        })
        .eq('id', sessionId)
        .in('status', ['active', 'approved'])
        .select()
        .single();

      if (error) throw error;

      // Log to blockchain
      if (this.blockchain) {
        await this.blockchain.logAuditEvent(
          revokerId,
          'JIT_ACCESS_REVOKED',
          session.resource_type,
          {
            sessionId,
            revokedFor: session.user_id,
            reason
          }
        );
      }

      return true;
    } catch (error) {
      console.error('Error revoking access:', error);
      return false;
    }
  }

  /**
   * Check if user has active JIT access to a resource
   */
  async hasAccess(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('has_jit_access', {
        _user_id: userId,
        _resource_type: resourceType,
        _resource_id: resourceId
      });

    if (error) {
      console.error('Error checking JIT access:', error);
      return false;
    }

    return data || false;
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<JITAccessSession[]> {
    const { data, error } = await supabase
      .from('jit_access_sessions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'pending', 'approved'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }

    return (data || []) as JITAccessSession[];
  }

  /**
   * Get pending access requests (for approvers)
   */
  async getPendingRequests(): Promise<JITAccessSession[]> {
    const { data, error } = await supabase
      .from('jit_access_sessions')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }

    return (data || []) as JITAccessSession[];
  }

  /**
   * Expire old sessions (should be run periodically)
   */
  async expireOldSessions(): Promise<number> {
    const { data, error } = await supabase.rpc('expire_jit_sessions');

    if (error) {
      console.error('Error expiring sessions:', error);
      return 0;
    }

    return data || 0;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async activateSession(sessionId: string): Promise<void> {
    await supabase
      .from('jit_access_sessions')
      .update({ status: 'active' })
      .eq('id', sessionId);
  }

  private async calculateRiskLevel(request: JITAccessRequest): Promise<RiskLevel> {
    // Risk factors to consider:
    let riskScore = 0;

    // 1. Resource type criticality
    const criticalResources = ['admin_panel', 'privileged_accounts', 'financial_data'];
    const highRiskResources = ['sensitive_documents', 'user_data', 'production_systems'];

    if (criticalResources.includes(request.resourceType)) {
      riskScore += 40;
    } else if (highRiskResources.includes(request.resourceType)) {
      riskScore += 25;
    } else {
      riskScore += 10;
    }

    // 2. Access level
    const writeAccess = ['write', 'edit', 'delete', 'admin', 'use'];
    if (writeAccess.includes(request.accessLevel.toLowerCase())) {
      riskScore += 20;
    }

    // 3. Duration
    if (request.duration > 24) {
      riskScore += 20;
    } else if (request.duration > 8) {
      riskScore += 10;
    }

    // 4. User history (simplified - could be enhanced)
    const context = request.requestContext || {};
    if (context.isNewUser) {
      riskScore += 15;
    }
    if (context.hasViolations) {
      riskScore += 25;
    }

    // Convert score to risk level
    if (riskScore >= 70) return 'critical';
    if (riskScore >= 45) return 'high';
    if (riskScore >= 25) return 'medium';
    return 'low';
  }

  private async getPolicy(
    resourceType: string,
    riskLevel: RiskLevel
  ): Promise<JITAccessPolicy | null> {
    const { data, error } = await supabase
      .from('jit_access_policies')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('risk_level', riskLevel)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching policy:', error);
      return null;
    }

    return data as JITAccessPolicy | null;
  }

  private parseDuration(duration: string): number {
    // Parse PostgreSQL interval to hours
    const match = duration.match(/(\d+)\s*(hour|day|week)/i);
    if (!match) return 4; // default 4 hours

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'hour':
        return value;
      case 'day':
        return value * 24;
      case 'week':
        return value * 24 * 7;
      default:
        return 4;
    }
  }
}
