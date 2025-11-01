import { supabase } from '@/integrations/supabase/client';

export interface PQCMigrationStatus {
  id: string;
  userId: string;
  currentAlgorithm: string;
  targetAlgorithm: string;
  migrationStage: 'pending' | 'dual_mode' | 'transitioning' | 'completed' | 'failed';
  dualModeEnabled: boolean;
  legacyKeysCount: number;
  pqcKeysCount: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  migrationMetadata: any;
}

/**
 * Post-Quantum Cryptography Migration Manager
 * Handles gradual migration from classical to PQC algorithms
 */
export class PQCMigrationManager {
  /**
   * Initialize PQC migration for a user
   */
  static async initializeMigration(
    userId: string,
    currentAlgorithm: string,
    targetAlgorithm: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('pqc_migration_status')
      .insert({
        user_id: userId,
        current_algorithm: currentAlgorithm,
        target_algorithm: targetAlgorithm,
        migration_stage: 'pending',
        dual_mode_enabled: false,
        legacy_keys_count: 0,
        pqc_keys_count: 0,
        migration_metadata: {
          initialized_at: new Date().toISOString(),
          migration_plan: 'gradual_rollout'
        }
      });

    return !error;
  }

  /**
   * Enable dual-mode operation (support both legacy and PQC)
   */
  static async enableDualMode(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('pqc_migration_status')
      .update({
        migration_stage: 'dual_mode',
        dual_mode_enabled: true,
        migration_metadata: {
          dual_mode_enabled_at: new Date().toISOString()
        }
      })
      .eq('user_id', userId);

    return !error;
  }

  /**
   * Transition to PQC-only mode
   */
  static async transitionToPQC(userId: string): Promise<boolean> {
    // Check if enough PQC keys are generated
    const status = await this.getMigrationStatus(userId);
    
    if (!status || status.pqcKeysCount === 0) {
      return false;
    }

    const { error } = await supabase
      .from('pqc_migration_status')
      .update({
        migration_stage: 'transitioning',
        dual_mode_enabled: false,
        migration_metadata: {
          transition_started_at: new Date().toISOString()
        }
      })
      .eq('user_id', userId);

    return !error;
  }

  /**
   * Complete migration
   */
  static async completeMigration(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('pqc_migration_status')
      .update({
        migration_stage: 'completed',
        completed_at: new Date().toISOString(),
        migration_metadata: {
          completed_at: new Date().toISOString(),
          migration_duration_ms: Date.now()
        }
      })
      .eq('user_id', userId);

    return !error;
  }

  /**
   * Mark migration as failed
   */
  static async failMigration(userId: string, errorMessage: string): Promise<boolean> {
    const { error } = await supabase
      .from('pqc_migration_status')
      .update({
        migration_stage: 'failed',
        error_message: errorMessage,
        migration_metadata: {
          failed_at: new Date().toISOString(),
          error: errorMessage
        }
      })
      .eq('user_id', userId);

    return !error;
  }

  /**
   * Get migration status for a user
   */
  static async getMigrationStatus(userId: string): Promise<PQCMigrationStatus | null> {
    const { data, error } = await supabase
      .from('pqc_migration_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      currentAlgorithm: data.current_algorithm,
      targetAlgorithm: data.target_algorithm,
      migrationStage: data.migration_stage as any,
      dualModeEnabled: data.dual_mode_enabled,
      legacyKeysCount: data.legacy_keys_count,
      pqcKeysCount: data.pqc_keys_count,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      errorMessage: data.error_message,
      migrationMetadata: data.migration_metadata
    };
  }

  /**
   * Update key counts
   */
  static async updateKeyCounts(
    userId: string,
    legacyCount: number,
    pqcCount: number
  ): Promise<boolean> {
    const { error } = await supabase
      .from('pqc_migration_status')
      .update({
        legacy_keys_count: legacyCount,
        pqc_keys_count: pqcCount
      })
      .eq('user_id', userId);

    return !error;
  }

  /**
   * Get migration progress percentage
   */
  static async getMigrationProgress(userId: string): Promise<number> {
    const status = await this.getMigrationStatus(userId);
    
    if (!status) return 0;

    switch (status.migrationStage) {
      case 'pending':
        return 0;
      case 'dual_mode':
        return 25;
      case 'transitioning':
        const totalKeys = status.legacyKeysCount + status.pqcKeysCount;
        const pqcPercentage = totalKeys > 0 
          ? (status.pqcKeysCount / totalKeys) * 50 
          : 0;
        return 25 + pqcPercentage;
      case 'completed':
        return 100;
      case 'failed':
        return -1;
      default:
        return 0;
    }
  }
}
