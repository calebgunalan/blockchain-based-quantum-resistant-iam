import { supabase } from '@/integrations/supabase/client';

export type MetricType = 
  | 'key_generation' 
  | 'signing' 
  | 'verification' 
  | 'encryption' 
  | 'decryption' 
  | 'key_exchange';

export interface PerformanceMetric {
  metricType: MetricType;
  algorithm: string;
  operationTimeMs: number;
  keySizeBytes?: number;
  dataSizeBytes?: number;
  cacheHit?: boolean;
  batchSize?: number;
  metadata?: any;
}

/**
 * Quantum Performance Tracker
 * Monitors and analyzes cryptographic operation performance
 */
export class QuantumPerformanceTracker {
  /**
   * Record a performance metric
   */
  static async recordMetric(
    userId: string,
    metric: PerformanceMetric
  ): Promise<boolean> {
    const { error } = await supabase
      .from('quantum_performance_metrics')
      .insert({
        user_id: userId,
        metric_type: metric.metricType,
        algorithm: metric.algorithm,
        operation_time_ms: metric.operationTimeMs,
        key_size_bytes: metric.keySizeBytes,
        data_size_bytes: metric.dataSizeBytes,
        cache_hit: metric.cacheHit || false,
        batch_size: metric.batchSize || 1,
        metadata: metric.metadata || {}
      });

    return !error;
  }

  /**
   * Time an operation and record its performance
   */
  static async timeOperation<T>(
    userId: string,
    metricType: MetricType,
    algorithm: string,
    operation: () => Promise<T>,
    additionalData?: Partial<PerformanceMetric>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      
      await this.recordMetric(userId, {
        metricType,
        algorithm,
        operationTimeMs: endTime - startTime,
        ...additionalData
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      // Still record the metric even on failure
      await this.recordMetric(userId, {
        metricType,
        algorithm,
        operationTimeMs: endTime - startTime,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          ...additionalData?.metadata
        }
      });
      
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  static async getPerformanceStats(
    algorithm?: string,
    hoursBack: number = 24
  ) {
    const { data } = await supabase.rpc('get_quantum_performance_stats', {
      algorithm_param: algorithm,
      hours_back: hoursBack
    });

    return data || {
      total_operations: 0,
      avg_operation_time_ms: 0,
      min_operation_time_ms: 0,
      max_operation_time_ms: 0,
      cache_hit_rate: 0,
      by_operation_type: {}
    };
  }

  /**
   * Get recent slow operations
   */
  static async getSlowOperations(
    thresholdMs: number = 1000,
    limit: number = 50
  ) {
    const { data, error } = await supabase
      .from('quantum_performance_metrics')
      .select('*')
      .gte('operation_time_ms', thresholdMs)
      .order('operation_time_ms', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data;
  }

  /**
   * Compare algorithm performance
   */
  static async compareAlgorithms(
    algorithms: string[],
    metricType: MetricType,
    hoursBack: number = 24
  ) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hoursBack);

    const results: Record<string, any> = {};

    for (const algorithm of algorithms) {
      const { data, error } = await supabase
        .from('quantum_performance_metrics')
        .select('operation_time_ms, cache_hit')
        .eq('algorithm', algorithm)
        .eq('metric_type', metricType)
        .gte('recorded_at', cutoff.toISOString());

      if (!error && data && data.length > 0) {
        const times = data.map(d => d.operation_time_ms);
        const cacheHits = data.filter(d => d.cache_hit).length;
        
        results[algorithm] = {
          operations: data.length,
          avgTime: times.reduce((a, b) => a + b, 0) / times.length,
          minTime: Math.min(...times),
          maxTime: Math.max(...times),
          cacheHitRate: (cacheHits / data.length) * 100
        };
      }
    }

    return results;
  }

  /**
   * Get cache effectiveness
   */
  static async getCacheEffectiveness(hoursBack: number = 24) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hoursBack);

    const { data, error } = await supabase
      .from('quantum_performance_metrics')
      .select('cache_hit, operation_time_ms')
      .gte('recorded_at', cutoff.toISOString());

    if (error || !data || data.length === 0) {
      return {
        totalOperations: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheHitRate: 0,
        avgTimeCacheHit: 0,
        avgTimeCacheMiss: 0,
        speedup: 0
      };
    }

    const cacheHitOps = data.filter(d => d.cache_hit);
    const cacheMissOps = data.filter(d => !d.cache_hit);

    const avgTimeCacheHit = cacheHitOps.length > 0
      ? cacheHitOps.reduce((sum, d) => sum + d.operation_time_ms, 0) / cacheHitOps.length
      : 0;

    const avgTimeCacheMiss = cacheMissOps.length > 0
      ? cacheMissOps.reduce((sum, d) => sum + d.operation_time_ms, 0) / cacheMissOps.length
      : 0;

    return {
      totalOperations: data.length,
      cacheHits: cacheHitOps.length,
      cacheMisses: cacheMissOps.length,
      cacheHitRate: (cacheHitOps.length / data.length) * 100,
      avgTimeCacheHit,
      avgTimeCacheMiss,
      speedup: avgTimeCacheMiss > 0 ? avgTimeCacheMiss / avgTimeCacheHit : 0
    };
  }
}
