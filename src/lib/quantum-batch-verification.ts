import { supabase } from '@/integrations/supabase/client';
import { QuantumSignatures } from './quantum-crypto';

export interface BatchVerificationResult {
  batchId: string;
  signatureCount: number;
  successCount: number;
  failureCount: number;
  verificationTimeMs: number;
  results: Array<{
    index: number;
    verified: boolean;
    error?: string;
  }>;
}

export interface SignatureToVerify {
  message: Uint8Array;
  signature: Uint8Array;
  publicKey: Uint8Array;
}

/**
 * Quantum Batch Signature Verification
 * Optimizes verification performance through batching
 */
export class QuantumBatchVerification {
  private static readonly MAX_BATCH_SIZE = 1000;
  private static readonly BATCH_TIMEOUT_MS = 5000;

  /**
   * Verify multiple signatures in batch
   */
  static async verifyBatch(
    signatures: SignatureToVerify[],
    algorithm: string = 'Ed25519'
  ): Promise<BatchVerificationResult> {
    const batchId = crypto.randomUUID();
    const startTime = performance.now();
    
    const results: Array<{
      index: number;
      verified: boolean;
      error?: string;
    }> = [];

    let successCount = 0;
    let failureCount = 0;

    // Process in parallel for better performance
    const verificationPromises = signatures.map(async (sig, index) => {
      try {
        const verified = await QuantumSignatures.verify(
          sig.signature,
          sig.message,
          sig.publicKey
        );

        if (verified) {
          successCount++;
        } else {
          failureCount++;
        }

        return {
          index,
          verified,
        };
      } catch (error) {
        failureCount++;
        return {
          index,
          verified: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    results.push(...await Promise.all(verificationPromises));

    const endTime = performance.now();
    const verificationTimeMs = Math.round(endTime - startTime);

    // Log batch verification
    await this.logBatchVerification(
      batchId,
      signatures.length,
      verificationTimeMs,
      successCount,
      failureCount,
      algorithm
    );

    return {
      batchId,
      signatureCount: signatures.length,
      successCount,
      failureCount,
      verificationTimeMs,
      results
    };
  }

  /**
   * Verify signatures with aggregation (optimization for same message)
   */
  static async verifyAggregated(
    message: Uint8Array,
    signatures: Array<{ signature: Uint8Array; publicKey: Uint8Array }>,
    algorithm: string = 'Ed25519'
  ): Promise<BatchVerificationResult> {
    const batchId = crypto.randomUUID();
    const startTime = performance.now();

    const results: Array<{
      index: number;
      verified: boolean;
      error?: string;
    }> = [];

    let successCount = 0;
    let failureCount = 0;

    // All signatures are for the same message, optimize verification
    for (let i = 0; i < signatures.length; i++) {
      try {
        const verified = await QuantumSignatures.verify(
          signatures[i].signature,
          message,
          signatures[i].publicKey
        );

        results.push({
          index: i,
          verified
        });

        if (verified) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        failureCount++;
        results.push({
          index: i,
          verified: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const endTime = performance.now();
    const verificationTimeMs = Math.round(endTime - startTime);

    await this.logBatchVerification(
      batchId,
      signatures.length,
      verificationTimeMs,
      successCount,
      failureCount,
      algorithm
    );

    return {
      batchId,
      signatureCount: signatures.length,
      successCount,
      failureCount,
      verificationTimeMs,
      results
    };
  }

  /**
   * Log batch verification to database
   */
  private static async logBatchVerification(
    batchId: string,
    signatureCount: number,
    verificationTimeMs: number,
    successCount: number,
    failureCount: number,
    algorithm: string
  ): Promise<void> {
    const { error } = await supabase
      .from('quantum_batch_verifications')
      .insert({
        batch_id: batchId,
        signature_count: signatureCount,
        verification_time_ms: verificationTimeMs,
        success_count: successCount,
        failure_count: failureCount,
        algorithm,
        batch_metadata: {
          avg_time_per_signature: verificationTimeMs / signatureCount,
          success_rate: (successCount / signatureCount) * 100
        }
      });

    if (error) {
      console.error('Failed to log batch verification:', error);
    }
  }

  /**
   * Get batch verification history
   */
  static async getVerificationHistory(limit: number = 50) {
    const { data, error } = await supabase
      .from('quantum_batch_verifications')
      .select('*')
      .order('verified_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data;
  }

  /**
   * Get verification statistics
   */
  static async getVerificationStats(hoursBack: number = 24) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hoursBack);

    const { data, error } = await supabase
      .from('quantum_batch_verifications')
      .select('*')
      .gte('verified_at', cutoff.toISOString());

    if (error || !data) {
      return {
        totalBatches: 0,
        totalSignatures: 0,
        avgBatchSize: 0,
        avgVerificationTime: 0,
        successRate: 0
      };
    }

    const totalBatches = data.length;
    const totalSignatures = data.reduce((sum, b) => sum + b.signature_count, 0);
    const totalSuccess = data.reduce((sum, b) => sum + b.success_count, 0);
    const totalTime = data.reduce((sum, b) => sum + b.verification_time_ms, 0);

    return {
      totalBatches,
      totalSignatures,
      avgBatchSize: totalSignatures / totalBatches,
      avgVerificationTime: totalTime / totalBatches,
      successRate: (totalSuccess / totalSignatures) * 100
    };
  }
}
