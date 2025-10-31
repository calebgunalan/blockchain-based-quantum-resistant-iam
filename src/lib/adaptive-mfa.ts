/**
 * Adaptive MFA (Multi-Factor Authentication) Manager
 * Phase 3: IAM Enhancements
 * 
 * Risk-based authentication that calculates MFA requirements based on context:
 * - Low risk → No MFA
 * - Medium risk → SMS/Email OTP
 * - High risk → Hardware token + Biometric
 * - Critical risk → Multi-approver workflow
 */

import { supabase } from '@/integrations/supabase/client';
import { BlockchainIntegrationManager } from './enhanced-quantum-blockchain-integration';

// ============================================================================
// Type Definitions
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type MFAMethod = 'none' | 'sms' | 'email' | 'totp' | 'hardware_token' | 'biometric' | 'multi_approver';
export type MFALevel = 'none' | 'basic' | 'enhanced' | 'critical';
export type MFAEventType = 'login_attempt' | 'mfa_challenge' | 'mfa_success' | 'mfa_failure' | 'risk_assessment';

export interface AuthContext {
  userId: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  geolocation?: {
    country?: string;
    city?: string;
    isVPN?: boolean;
  };
  userAgent?: string;
  sessionHistory?: {
    recentLogins: number;
    failedAttempts: number;
    lastLoginAt?: Date;
  };
  accountAge?: number; // in days
  trustScore?: number;
  hasActiveSessions?: boolean;
  isNewDevice?: boolean;
  isNewLocation?: boolean;
}

export interface RiskAssessment {
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  requiredMFALevel: MFALevel;
  recommendedMFAMethods: MFAMethod[];
  allowAccess: boolean;
  reason: string;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MFAChallenge {
  id: string;
  userId: string;
  challengeType: MFAMethod;
  expiresAt: Date;
  metadata: Record<string, any>;
}

export interface MFAVerificationResult {
  success: boolean;
  message: string;
  challengeId?: string;
}

// ============================================================================
// Adaptive MFA Manager Class
// ============================================================================

export class AdaptiveMFAManager {
  private blockchain?: BlockchainIntegrationManager;

  constructor(enableBlockchainAudit: boolean = true) {
    if (enableBlockchainAudit) {
      this.blockchain = new BlockchainIntegrationManager();
      this.blockchain.initialize().catch(console.error);
    }
  }

  /**
   * Calculate MFA requirement based on authentication context
   */
  async calculateMFARequirement(context: AuthContext): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];
    let riskScore = 0;

    // 1. IP/Location Analysis
    if (context.geolocation?.isVPN) {
      const factor: RiskFactor = {
        factor: 'vpn_usage',
        weight: 25,
        description: 'VPN or proxy detected - increased anonymity risk',
        severity: 'medium'
      };
      riskFactors.push(factor);
      riskScore += factor.weight;
    }

    if (context.isNewLocation) {
      const factor: RiskFactor = {
        factor: 'new_location',
        weight: 15,
        description: 'Login from new geographic location',
        severity: 'medium'
      };
      riskFactors.push(factor);
      riskScore += factor.weight;
    }

    // 2. Device Analysis
    if (context.isNewDevice) {
      const factor: RiskFactor = {
        factor: 'new_device',
        weight: 20,
        description: 'Login from unrecognized device',
        severity: 'medium'
      };
      riskFactors.push(factor);
      riskScore += factor.weight;
    }

    // 3. Session History Analysis
    const failedAttempts = context.sessionHistory?.failedAttempts || 0;
    if (failedAttempts > 3) {
      const factor: RiskFactor = {
        factor: 'failed_attempts',
        weight: 30,
        description: `${failedAttempts} recent failed login attempts`,
        severity: 'high'
      };
      riskFactors.push(factor);
      riskScore += factor.weight;
    }

    const recentLogins = context.sessionHistory?.recentLogins || 0;
    if (recentLogins > 10) {
      const factor: RiskFactor = {
        factor: 'high_activity',
        weight: 15,
        description: 'Unusually high number of recent logins',
        severity: 'medium'
      };
      riskFactors.push(factor);
      riskScore += factor.weight;
    }

    // 4. Account Age
    const accountAge = context.accountAge || 0;
    if (accountAge < 7) {
      const factor: RiskFactor = {
        factor: 'new_account',
        weight: 10,
        description: 'Account created less than 7 days ago',
        severity: 'low'
      };
      riskFactors.push(factor);
      riskScore += factor.weight;
    }

    // 5. Trust Score
    const trustScore = context.trustScore || 50;
    if (trustScore < 30) {
      const factor: RiskFactor = {
        factor: 'low_trust_score',
        weight: 35,
        description: 'User trust score below threshold',
        severity: 'critical'
      };
      riskFactors.push(factor);
      riskScore += factor.weight;
    } else if (trustScore < 50) {
      const factor: RiskFactor = {
        factor: 'medium_trust_score',
        weight: 15,
        description: 'User trust score requires monitoring',
        severity: 'medium'
      };
      riskFactors.push(factor);
      riskScore += factor.weight;
    }

    // 6. Time-based Risk
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 22) {
      const factor: RiskFactor = {
        factor: 'unusual_time',
        weight: 10,
        description: 'Login outside normal business hours',
        severity: 'low'
      };
      riskFactors.push(factor);
      riskScore += factor.weight;
    }

    // Determine risk level
    const riskLevel: RiskLevel = 
      riskScore >= 70 ? 'critical' :
      riskScore >= 40 ? 'high' :
      riskScore >= 20 ? 'medium' :
      'low';

    // Determine MFA requirements
    const { mfaLevel, mfaMethods, allowAccess, reason } = this.determineMFARequirements(
      riskLevel,
      riskScore
    );

    // Log risk assessment to blockchain
    await this.logMFAEvent(context.userId, 'risk_assessment', riskLevel, riskScore, {
      riskFactors: riskFactors.map(f => f.factor),
      requiredMFALevel: mfaLevel
    });

    return {
      riskScore,
      riskLevel,
      riskFactors,
      requiredMFALevel: mfaLevel,
      recommendedMFAMethods: mfaMethods,
      allowAccess,
      reason
    };
  }

  /**
   * Create MFA challenge based on required level
   */
  async createMFAChallenge(
    userId: string,
    method: MFAMethod
  ): Promise<MFAChallenge> {
    const token = this.generateToken();
    const tokenHash = await this.hashToken(token);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const { data, error } = await supabase
      .from('mfa_challenge_tokens')
      .insert({
        user_id: userId,
        challenge_type: method,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        metadata: {
          createdAt: new Date().toISOString(),
          method
        }
      })
      .select()
      .single();

    if (error) throw error;

    // Log challenge creation
    await this.logMFAEvent(userId, 'mfa_challenge', 'medium', 0, {
      challengeId: data.id,
      method
    });

    return {
      id: data.id,
      userId,
      challengeType: method,
      expiresAt,
      metadata: {
        token: method === 'sms' || method === 'email' ? token : undefined
      }
    };
  }

  /**
   * Verify MFA challenge
   */
  async verifyMFAChallenge(
    challengeId: string,
    token: string,
    userId: string
  ): Promise<MFAVerificationResult> {
    try {
      // Get challenge
      const { data: challenge, error: fetchError } = await supabase
        .from('mfa_challenge_tokens')
        .select('*')
        .eq('id', challengeId)
        .eq('user_id', userId)
        .is('used_at', null)
        .single();

      if (fetchError || !challenge) {
        await this.logMFAEvent(userId, 'mfa_failure', 'medium', 0, {
          reason: 'Challenge not found'
        });
        return {
          success: false,
          message: 'Invalid or expired challenge'
        };
      }

      // Check expiration
      if (new Date(challenge.expires_at) < new Date()) {
        await this.logMFAEvent(userId, 'mfa_failure', 'medium', 0, {
          reason: 'Challenge expired'
        });
        return {
          success: false,
          message: 'Challenge has expired'
        };
      }

      // Check attempts
      if (challenge.attempts >= challenge.max_attempts) {
        await this.logMFAEvent(userId, 'mfa_failure', 'high', 0, {
          reason: 'Max attempts exceeded'
        });
        return {
          success: false,
          message: 'Maximum verification attempts exceeded'
        };
      }

      // Verify token
      const tokenHash = await this.hashToken(token);
      const isValid = tokenHash === challenge.token_hash;

      if (!isValid) {
        // Increment attempts
        await supabase
          .from('mfa_challenge_tokens')
          .update({ attempts: challenge.attempts + 1 })
          .eq('id', challengeId);

        await this.logMFAEvent(userId, 'mfa_failure', 'medium', 0, {
          reason: 'Invalid token',
          attempts: challenge.attempts + 1
        });

        return {
          success: false,
          message: 'Invalid verification code'
        };
      }

      // Mark as used
      await supabase
        .from('mfa_challenge_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', challengeId);

      // Log success
      await this.logMFAEvent(userId, 'mfa_success', 'low', 0, {
        challengeId,
        method: challenge.challenge_type
      });

      return {
        success: true,
        message: 'MFA verification successful',
        challengeId
      };
    } catch (error) {
      console.error('Error verifying MFA challenge:', error);
      return {
        success: false,
        message: 'Verification failed'
      };
    }
  }

  /**
   * Get MFA history for user
   */
  async getMFAHistory(userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('adaptive_mfa_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching MFA history:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private determineMFARequirements(
    riskLevel: RiskLevel,
    riskScore: number
  ): {
    mfaLevel: MFALevel;
    mfaMethods: MFAMethod[];
    allowAccess: boolean;
    reason: string;
  } {
    switch (riskLevel) {
      case 'low':
        return {
          mfaLevel: 'none',
          mfaMethods: ['none'],
          allowAccess: true,
          reason: 'Low risk - standard authentication sufficient'
        };

      case 'medium':
        return {
          mfaLevel: 'basic',
          mfaMethods: ['sms', 'email', 'totp'],
          allowAccess: true,
          reason: 'Medium risk - basic MFA required'
        };

      case 'high':
        return {
          mfaLevel: 'enhanced',
          mfaMethods: ['hardware_token', 'biometric', 'totp'],
          allowAccess: true,
          reason: 'High risk - enhanced MFA with hardware token or biometric required'
        };

      case 'critical':
        if (riskScore >= 90) {
          return {
            mfaLevel: 'critical',
            mfaMethods: ['multi_approver'],
            allowAccess: false,
            reason: 'Critical risk detected - access requires multi-approver workflow'
          };
        }
        return {
          mfaLevel: 'critical',
          mfaMethods: ['hardware_token', 'biometric'],
          allowAccess: true,
          reason: 'Critical risk - hardware token AND biometric verification required'
        };

      default:
        return {
          mfaLevel: 'basic',
          mfaMethods: ['sms', 'email'],
          allowAccess: true,
          reason: 'Default MFA requirement'
        };
    }
  }

  private async logMFAEvent(
    userId: string,
    eventType: MFAEventType,
    riskLevel: RiskLevel,
    riskScore: number,
    contextData: Record<string, any>
  ): Promise<void> {
    try {
      // Log to database
      await supabase.from('adaptive_mfa_events').insert({
        user_id: userId,
        event_type: eventType,
        risk_level: riskLevel,
        risk_score: riskScore,
        required_mfa_level: contextData.requiredMFALevel || 'none',
        context_data: contextData,
        risk_factors: contextData.riskFactors || [],
        success: eventType === 'mfa_success'
      });

      // Log to blockchain
      if (this.blockchain) {
        await this.blockchain.logAuditEvent(
          userId,
          `ADAPTIVE_MFA_${eventType.toUpperCase()}`,
          'authentication',
          {
            eventType,
            riskLevel,
            riskScore,
            ...contextData
          }
        );
      }
    } catch (error) {
      console.error('Error logging MFA event:', error);
    }
  }

  private generateToken(): string {
    // Generate 6-digit code for SMS/email
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
