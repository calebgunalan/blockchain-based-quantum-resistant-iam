import { QuantumBlockchain } from './quantum-blockchain';
import { QuantumSignatures } from './quantum-crypto';

/**
 * Smart Contract-like Policy Engine
 * Simulates Hyperledger Fabric chaincode for access control policies
 */

export interface BlockchainPolicy {
  id: string;
  name: string;
  resource: string;
  allowedRoles: string[];
  timeRestrictions?: {
    days: number[]; // 0-6 (Sunday-Saturday)
    hours: { start: number; end: number }; // 0-23
  };
  ipRestrictions?: {
    allowedRanges: string[];
    blockedRanges: string[];
  };
  quantumSignatureRequired: boolean;
  trustScoreMinimum: number;
  mfaRequired: boolean;
  conditions: PolicyCondition[];
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  version: number;
}

export interface PolicyCondition {
  type: 'role' | 'time' | 'location' | 'device' | 'trust_score' | 'mfa' | 'custom';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
  required: boolean;
}

export interface PolicyEvaluationContext {
  userId: string;
  userRoles: string[];
  resource: string;
  action: string;
  timestamp: Date;
  ipAddress?: string;
  deviceFingerprint?: string;
  trustScore: number;
  mfaVerified: boolean;
  quantumSignature?: string;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  policyId: string;
  reason: string;
  matchedConditions: string[];
  failedConditions: string[];
  riskScore: number;
  requiresApproval: boolean;
}

/**
 * Blockchain-based Policy Engine
 * Enforces access control policies with immutable audit trail
 */
export class BlockchainPolicyEngine {
  private blockchain: QuantumBlockchain;
  private policies: Map<string, BlockchainPolicy>;

  constructor(blockchain: QuantumBlockchain) {
    this.blockchain = blockchain;
    this.policies = new Map();
  }

  /**
   * Deploy a new policy (like deploying a smart contract)
   */
  async deployPolicy(policy: BlockchainPolicy): Promise<string> {
    // Validate policy
    this.validatePolicy(policy);

    // Store policy
    this.policies.set(policy.id, policy);

    // Log to blockchain
    await this.blockchain.addTransaction({
      id: `policy-deploy-${Date.now()}`,
      type: 'policy_change',
      userId: 'system',
      action: 'POLICY_DEPLOYED',
      resource: 'access_policies',
      timestamp: new Date(),
      metadata: {
        policy_id: policy.id,
        policy_name: policy.name,
        resource: policy.resource,
        version: policy.version,
        quantum_protected: true
      }
    });

    return policy.id;
  }

  /**
   * Evaluate policy (like executing a smart contract function)
   */
  async evaluatePolicy(
    policyId: string,
    context: PolicyEvaluationContext
  ): Promise<PolicyEvaluationResult> {
    const policy = this.policies.get(policyId);

    if (!policy) {
      return {
        allowed: false,
        policyId,
        reason: 'Policy not found',
        matchedConditions: [],
        failedConditions: ['policy_not_found'],
        riskScore: 100,
        requiresApproval: false
      };
    }

    if (!policy.isActive) {
      return {
        allowed: false,
        policyId,
        reason: 'Policy is inactive',
        matchedConditions: [],
        failedConditions: ['policy_inactive'],
        riskScore: 100,
        requiresApproval: false
      };
    }

    // Check expiration
    if (policy.expiresAt && new Date() > policy.expiresAt) {
      return {
        allowed: false,
        policyId,
        reason: 'Policy has expired',
        matchedConditions: [],
        failedConditions: ['policy_expired'],
        riskScore: 100,
        requiresApproval: false
      };
    }

    const matchedConditions: string[] = [];
    const failedConditions: string[] = [];
    let riskScore = 0;

    // 1. Check role-based access
    const hasRole = policy.allowedRoles.some(role => 
      context.userRoles.includes(role)
    );
    
    if (hasRole) {
      matchedConditions.push('role_check');
    } else {
      failedConditions.push('role_check');
      riskScore += 30;
    }

    // 2. Check time restrictions
    if (policy.timeRestrictions) {
      const now = context.timestamp;
      const day = now.getDay();
      const hour = now.getHours();

      const isAllowedDay = policy.timeRestrictions.days.includes(day);
      const isAllowedHour = 
        hour >= policy.timeRestrictions.hours.start &&
        hour < policy.timeRestrictions.hours.end;

      if (isAllowedDay && isAllowedHour) {
        matchedConditions.push('time_restriction');
      } else {
        failedConditions.push('time_restriction');
        riskScore += 20;
      }
    }

    // 3. Check trust score
    if (context.trustScore < policy.trustScoreMinimum) {
      failedConditions.push('trust_score');
      riskScore += 25;
    } else {
      matchedConditions.push('trust_score');
    }

    // 4. Check MFA requirement
    if (policy.mfaRequired && !context.mfaVerified) {
      failedConditions.push('mfa_required');
      riskScore += 20;
    } else if (policy.mfaRequired) {
      matchedConditions.push('mfa_verified');
    }

    // 5. Check quantum signature
    if (policy.quantumSignatureRequired && !context.quantumSignature) {
      failedConditions.push('quantum_signature');
      riskScore += 15;
    } else if (policy.quantumSignatureRequired) {
      matchedConditions.push('quantum_signature');
    }

    // 6. Evaluate custom conditions
    for (const condition of policy.conditions) {
      const conditionResult = this.evaluateCondition(condition, context);
      if (conditionResult.passed) {
        matchedConditions.push(conditionResult.name);
      } else {
        failedConditions.push(conditionResult.name);
        riskScore += conditionResult.riskImpact;
      }
    }

    // Final decision
    const allowed = failedConditions.length === 0;
    const requiresApproval = riskScore > 50 && riskScore < 100;

    // Log evaluation to blockchain
    await this.blockchain.addTransaction({
      id: `policy-eval-${Date.now()}`,
      type: 'access_event',
      userId: context.userId,
      action: allowed ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
      resource: context.resource,
      timestamp: new Date(),
      metadata: {
        policy_id: policyId,
        matched_conditions: matchedConditions,
        failed_conditions: failedConditions,
        risk_score: riskScore,
        quantum_protected: true
      }
    });

    return {
      allowed,
      policyId,
      reason: allowed 
        ? 'All policy conditions met'
        : `Failed conditions: ${failedConditions.join(', ')}`,
      matchedConditions,
      failedConditions,
      riskScore,
      requiresApproval
    };
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: PolicyCondition,
    context: PolicyEvaluationContext
  ): { passed: boolean; name: string; riskImpact: number } {
    let passed = false;
    let riskImpact = condition.required ? 20 : 10;

    switch (condition.type) {
      case 'trust_score':
        passed = this.evaluateOperator(
          context.trustScore,
          condition.operator,
          condition.value
        );
        break;
      
      case 'role':
        passed = context.userRoles.some(role => 
          this.evaluateOperator(role, condition.operator, condition.value)
        );
        break;
      
      case 'device':
        passed = this.evaluateOperator(
          context.deviceFingerprint || '',
          condition.operator,
          condition.value
        );
        break;
      
      case 'location':
        passed = this.evaluateOperator(
          context.ipAddress || '',
          condition.operator,
          condition.value
        );
        break;
      
      default:
        passed = true;
    }

    return {
      passed,
      name: `${condition.type}_${condition.operator}`,
      riskImpact
    };
  }

  /**
   * Evaluate operator logic
   */
  private evaluateOperator(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'not_contains':
        return !String(actual).includes(String(expected));
      default:
        return false;
    }
  }

  /**
   * Get all active policies for a resource
   */
  getPoliciesForResource(resource: string): BlockchainPolicy[] {
    return Array.from(this.policies.values()).filter(
      policy => policy.resource === resource && policy.isActive
    );
  }

  /**
   * Update policy (new version)
   */
  async updatePolicy(
    policyId: string,
    updates: Partial<BlockchainPolicy>
  ): Promise<void> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error('Policy not found');
    }

    const updatedPolicy = {
      ...policy,
      ...updates,
      version: policy.version + 1,
      updatedAt: new Date()
    };

    this.validatePolicy(updatedPolicy as BlockchainPolicy);
    this.policies.set(policyId, updatedPolicy as BlockchainPolicy);

    // Log update to blockchain
    await this.blockchain.addTransaction({
      id: `policy-update-${Date.now()}`,
      type: 'policy_change',
      userId: 'system',
      action: 'POLICY_UPDATED',
      resource: 'access_policies',
      timestamp: new Date(),
      metadata: {
        policy_id: policyId,
        version: updatedPolicy.version,
        changes: Object.keys(updates),
        quantum_protected: true
      }
    });
  }

  /**
   * Revoke policy
   */
  async revokePolicy(policyId: string): Promise<void> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error('Policy not found');
    }

    policy.isActive = false;

    // Log revocation to blockchain
    await this.blockchain.addTransaction({
      id: `policy-revoke-${Date.now()}`,
      type: 'policy_change',
      userId: 'system',
      action: 'POLICY_REVOKED',
      resource: 'access_policies',
      timestamp: new Date(),
      metadata: {
        policy_id: policyId,
        quantum_protected: true
      }
    });
  }

  /**
   * Validate policy structure
   */
  private validatePolicy(policy: BlockchainPolicy): void {
    if (!policy.id || !policy.name || !policy.resource) {
      throw new Error('Invalid policy: missing required fields');
    }

    if (policy.allowedRoles.length === 0) {
      throw new Error('Invalid policy: must specify at least one allowed role');
    }

    if (policy.trustScoreMinimum < 0 || policy.trustScoreMinimum > 100) {
      throw new Error('Invalid policy: trust score must be between 0 and 100');
    }
  }

  /**
   * Get policy statistics
   */
  getPolicyStats() {
    const allPolicies = Array.from(this.policies.values());
    return {
      total: allPolicies.length,
      active: allPolicies.filter(p => p.isActive).length,
      expired: allPolicies.filter(p => p.expiresAt && new Date() > p.expiresAt).length,
      byResource: this.groupPoliciesByResource(allPolicies)
    };
  }

  private groupPoliciesByResource(policies: BlockchainPolicy[]) {
    const grouped: Record<string, number> = {};
    for (const policy of policies) {
      grouped[policy.resource] = (grouped[policy.resource] || 0) + 1;
    }
    return grouped;
  }

  /**
   * Verify blockchain integrity for policies
   */
  async verifyPolicyIntegrity(): Promise<boolean> {
    return await this.blockchain.isValidChain();
  }
}
