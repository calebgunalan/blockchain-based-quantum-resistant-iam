import { QuantumBlockchain, QuantumTransaction } from './quantum-blockchain';
import { QuantumDID } from './did-manager';
import { BlockchainPolicyEngine, PolicyEvaluationContext } from './blockchain-policy-engine';

/**
 * Blockchain Integration Layer
 * Bridges the application with the quantum-resistant blockchain
 */
export class BlockchainIntegration {
  private blockchain: QuantumBlockchain;
  private policyEngine: BlockchainPolicyEngine;

  constructor(blockchain: QuantumBlockchain) {
    this.blockchain = blockchain;
    this.policyEngine = new BlockchainPolicyEngine(blockchain);
  }

  /**
   * Get policy engine instance
   */
  getPolicyEngine(): BlockchainPolicyEngine {
    return this.policyEngine;
  }

  /**
   * Evaluate access with blockchain policies
   */
  async evaluateAccess(context: PolicyEvaluationContext): Promise<boolean> {
    const policies = this.policyEngine.getPoliciesForResource(context.resource);
    
    // If no policies exist, deny by default (zero-trust)
    if (policies.length === 0) {
      await this.logAccessEvent(
        context.userId,
        context.resource,
        context.action,
        false,
        { reason: 'No policies defined for resource' }
      );
      return false;
    }

    // Evaluate all policies - access granted if ANY policy allows
    for (const policy of policies) {
      const result = await this.policyEngine.evaluatePolicy(policy.id, context);
      
      if (result.allowed) {
        await this.logAccessEvent(
          context.userId,
          context.resource,
          context.action,
          true,
          { 
            policy_id: policy.id,
            matched_conditions: result.matchedConditions,
            risk_score: result.riskScore
          }
        );
        return true;
      }
    }

    // All policies denied access
    await this.logAccessEvent(
      context.userId,
      context.resource,
      context.action,
      false,
      { reason: 'All policies denied access' }
    );
    return false;
  }

  /**
   * Log identity creation to blockchain
   */
  async logIdentityCreation(userId: string, did: QuantumDID): Promise<string> {
    const transaction: Omit<QuantumTransaction, 'quantumSignature' | 'integrity_hash'> = {
      id: `identity-${Date.now()}-${Math.random()}`,
      type: 'audit_log',
      userId,
      action: 'IDENTITY_CREATED',
      resource: 'identity',
      timestamp: new Date(),
      metadata: {
        did: did.id,
        publicKeys: did.publicKey.map(pk => pk.id),
        created_at: new Date().toISOString()
      }
    };

    return await this.blockchain.addTransaction(transaction);
  }

  /**
   * Log audit event to blockchain
   */
  async logAuditEvent(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, any>
  ): Promise<string> {
    const transaction: Omit<QuantumTransaction, 'quantumSignature' | 'integrity_hash'> = {
      id: `audit-${Date.now()}-${Math.random()}`,
      type: 'audit_log',
      userId,
      action,
      resource,
      timestamp: new Date(),
      metadata: {
        ...details,
        blockchain_verified: true,
        quantum_protected: true
      }
    };

    return await this.blockchain.addTransaction(transaction);
  }

  /**
   * Grant permission on blockchain
   */
  async grantPermission(
    granterId: string,
    granteeId: string,
    resource: string,
    action: string,
    expiresAt?: Date
  ): Promise<string> {
    const transaction: Omit<QuantumTransaction, 'quantumSignature' | 'integrity_hash'> = {
      id: `permission-grant-${Date.now()}-${Math.random()}`,
      type: 'policy_change',
      userId: granterId,
      action: 'GRANT_PERMISSION',
      resource: 'permissions',
      timestamp: new Date(),
      metadata: {
        granter_id: granterId,
        grantee_id: granteeId,
        resource,
        action,
        expires_at: expiresAt?.toISOString(),
        granted_at: new Date().toISOString()
      }
    };

    return await this.blockchain.addTransaction(transaction);
  }

  /**
   * Revoke permission on blockchain
   */
  async revokePermission(
    revokerId: string,
    granteeId: string,
    resource: string,
    action: string
  ): Promise<string> {
    const transaction: Omit<QuantumTransaction, 'quantumSignature' | 'integrity_hash'> = {
      id: `permission-revoke-${Date.now()}-${Math.random()}`,
      type: 'policy_change',
      userId: revokerId,
      action: 'REVOKE_PERMISSION',
      resource: 'permissions',
      timestamp: new Date(),
      metadata: {
        revoker_id: revokerId,
        grantee_id: granteeId,
        resource,
        action,
        revoked_at: new Date().toISOString()
      }
    };

    return await this.blockchain.addTransaction(transaction);
  }

  /**
   * Log access event to blockchain
   */
  async logAccessEvent(
    userId: string,
    resource: string,
    action: string,
    success: boolean,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const transaction: Omit<QuantumTransaction, 'quantumSignature' | 'integrity_hash'> = {
      id: `access-${Date.now()}-${Math.random()}`,
      type: 'access_event',
      userId,
      action: success ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
      resource,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        resource,
        requested_action: action,
        success,
        timestamp: new Date().toISOString()
      }
    };

    return await this.blockchain.addTransaction(transaction);
  }

  /**
   * Log certificate issuance to blockchain
   */
  async logCertificateIssuance(
    userId: string,
    certificateId: string,
    certificateType: string,
    validUntil: Date
  ): Promise<string> {
    const transaction: Omit<QuantumTransaction, 'quantumSignature' | 'integrity_hash'> = {
      id: `cert-${Date.now()}-${Math.random()}`,
      type: 'certificate_issued',
      userId,
      action: 'CERTIFICATE_ISSUED',
      resource: 'certificates',
      timestamp: new Date(),
      metadata: {
        certificate_id: certificateId,
        certificate_type: certificateType,
        valid_until: validUntil.toISOString(),
        issued_at: new Date().toISOString()
      }
    };

    return await this.blockchain.addTransaction(transaction);
  }

  /**
   * Log key rotation to blockchain
   */
  async logKeyRotation(
    userId: string,
    keyType: string,
    oldKeyId: string,
    newKeyId: string
  ): Promise<string> {
    const transaction: Omit<QuantumTransaction, 'quantumSignature' | 'integrity_hash'> = {
      id: `key-rotation-${Date.now()}-${Math.random()}`,
      type: 'key_rotation',
      userId,
      action: 'KEY_ROTATED',
      resource: 'quantum_keys',
      timestamp: new Date(),
      metadata: {
        key_type: keyType,
        old_key_id: oldKeyId,
        new_key_id: newKeyId,
        rotated_at: new Date().toISOString(),
        quantum_safe: true
      }
    };

    return await this.blockchain.addTransaction(transaction);
  }

  /**
   * Verify transaction on blockchain
   */
  async verifyTransaction(transactionId: string): Promise<boolean> {
    const transaction = this.blockchain.getTransaction(transactionId);
    if (!transaction) {
      return false;
    }

    return await this.blockchain.isValidTransaction(transaction);
  }

  /**
   * Get audit trail for resource
   */
  getAuditTrail(resource: string): QuantumTransaction[] {
    return this.blockchain.getAuditTrail(resource);
  }

  /**
   * Get user's transaction history
   */
  getUserTransactionHistory(userId: string): QuantumTransaction[] {
    return this.blockchain.getTransactionsByUser(userId);
  }

  /**
   * Verify entire blockchain integrity
   */
  async verifyBlockchainIntegrity(): Promise<boolean> {
    return await this.blockchain.isValidChain();
  }

  /**
   * Get blockchain statistics
   */
  getBlockchainStats() {
    return this.blockchain.getChainInfo();
  }
}
