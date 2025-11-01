import { supabase } from '@/integrations/supabase/client';
import { QuantumSignatures, QuantumKEM } from './quantum-crypto';

export interface KeyRotationConfig {
  reason: 'scheduled' | 'compromised' | 'manual' | 'policy';
  rotationType: 'standard' | 'emergency' | 'migration';
  oldAlgorithm: string;
  newAlgorithm: string;
}

export interface KeyRotationHistory {
  id: string;
  userId: string;
  oldKeyId: string;
  newKeyId: string;
  rotationReason: string;
  oldAlgorithm: string;
  newAlgorithm: string;
  rotationType: string;
  completedAt: Date;
  initiatedBy: string;
  metadata: any;
}

/**
 * Quantum Key Rotation Manager
 * Handles automated and manual key rotation with full audit trail
 */
export class QuantumKeyRotation {
  private static readonly AUTO_ROTATION_DAYS = 90;
  private static readonly EMERGENCY_ROTATION_HOURS = 1;

  /**
   * Rotate signing keys
   */
  static async rotateSigningKey(
    userId: string,
    oldKeyId: string,
    config: KeyRotationConfig
  ): Promise<{ newKeyId: string; publicKey: Uint8Array } | null> {
    try {
      // Generate new key pair
      const newKeyPair = await QuantumSignatures.generateKeyPair();
      const newKeyId = crypto.randomUUID();

      // Store new key in quantum_keys table
      const { error: keyError } = await supabase
        .from('quantum_keys')
        .insert({
          user_id: userId,
          key_type: 'signing',
          public_key: Buffer.from(newKeyPair.publicKey).toString('base64'),
          algorithm: config.newAlgorithm
        } as any);

      if (keyError) {
        console.error('Failed to store new key:', keyError);
        return null;
      }

      // Record rotation
      await this.recordRotation(
        userId,
        oldKeyId,
        newKeyId,
        config
      );

      // Invalidate old key if emergency rotation
      if (config.rotationType === 'emergency') {
        await supabase
          .from('quantum_keys')
          .update({ is_active: false } as any)
          .eq('user_id', userId)
          .eq('id', oldKeyId);
      }

      return {
        newKeyId,
        publicKey: newKeyPair.publicKey
      };
    } catch (error) {
      console.error('Key rotation failed:', error);
      return null;
    }
  }

  /**
   * Rotate encryption keys (KEM)
   */
  static async rotateEncryptionKey(
    userId: string,
    oldKeyId: string,
    config: KeyRotationConfig
  ): Promise<{ newKeyId: string; publicKey: Uint8Array } | null> {
    try {
      const newKeyPair = await QuantumKEM.generateKeyPair();
      const newKeyId = crypto.randomUUID();

      const { error: keyError } = await supabase
        .from('quantum_keys')
        .insert({
          user_id: userId,
          key_type: 'encryption',
          public_key: Buffer.from(newKeyPair.publicKey).toString('base64'),
          algorithm: config.newAlgorithm
        } as any);

      if (keyError) {
        console.error('Failed to store new encryption key:', keyError);
        return null;
      }

      await this.recordRotation(userId, oldKeyId, newKeyId, config);

      return {
        newKeyId,
        publicKey: newKeyPair.publicKey
      };
    } catch (error) {
      console.error('Encryption key rotation failed:', error);
      return null;
    }
  }

  /**
   * Record key rotation in audit trail
   */
  private static async recordRotation(
    userId: string,
    oldKeyId: string,
    newKeyId: string,
    config: KeyRotationConfig
  ): Promise<void> {
    const { error } = await supabase.rpc('record_key_rotation', {
      user_id_param: userId,
      old_key_id_param: oldKeyId,
      new_key_id_param: newKeyId,
      rotation_reason_param: config.reason,
      old_algorithm_param: config.oldAlgorithm,
      new_algorithm_param: config.newAlgorithm,
      rotation_type_param: config.rotationType
    });

    if (error) {
      console.error('Failed to record rotation:', error);
    }
  }

  /**
   * Get rotation history for a user
   */
  static async getRotationHistory(
    userId: string,
    limit: number = 50
  ): Promise<KeyRotationHistory[]> {
    const { data, error } = await supabase
      .from('quantum_key_rotations')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      oldKeyId: row.old_key_id,
      newKeyId: row.new_key_id,
      rotationReason: row.rotation_reason,
      oldAlgorithm: row.old_algorithm,
      newAlgorithm: row.new_algorithm,
      rotationType: row.rotation_type,
      completedAt: new Date(row.completed_at),
      initiatedBy: row.initiated_by,
      metadata: row.metadata
    }));
  }

  /**
   * Check if key rotation is needed
   */
  static async needsRotation(
    userId: string,
    keyId: string
  ): Promise<{ needed: boolean; reason: string }> {
    // Get key creation date
    const { data: keyData } = await supabase
      .from('quantum_keys')
      .select('created_at, is_active')
      .eq('user_id', userId)
      .eq('id', keyId)
      .single();

    if (!keyData) {
      return { needed: true, reason: 'Key not found' };
    }

    if (!keyData.is_active) {
      return { needed: true, reason: 'Key is inactive' };
    }

    const keyAge = Date.now() - new Date(keyData.created_at as string).getTime();
    const maxAge = this.AUTO_ROTATION_DAYS * 24 * 60 * 60 * 1000;

    if (keyAge > maxAge) {
      return { needed: true, reason: 'Scheduled rotation due' };
    }

    return { needed: false, reason: 'Key is current' };
  }

  /**
   * Perform emergency rotation for compromised keys
   */
  static async emergencyRotation(
    userId: string,
    compromisedKeyId: string,
    keyType: 'signing' | 'encryption'
  ): Promise<boolean> {
    const config: KeyRotationConfig = {
      reason: 'compromised',
      rotationType: 'emergency',
      oldAlgorithm: 'Ed25519',
      newAlgorithm: 'Ed25519'
    };

    const result = keyType === 'signing'
      ? await this.rotateSigningKey(userId, compromisedKeyId, config)
      : await this.rotateEncryptionKey(userId, compromisedKeyId, config);

    return result !== null;
  }
}
