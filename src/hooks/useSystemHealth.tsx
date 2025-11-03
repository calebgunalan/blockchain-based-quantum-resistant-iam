import { useState, useEffect } from 'react';
import { RealTimeMonitoring } from '@/lib/real-time-monitoring';

export interface SystemHealthSummary {
  blockchain: {
    total_blocks: number;
    latest_block: number;
    avg_block_time: number;
  };
  p2p_network: {
    active_peers: number;
    avg_reputation: number;
    total_peers: number;
  };
  mempool: {
    pending_transactions: number;
    total_fees: number;
  };
  quantum_security: {
    active_keys: number;
    cache_hit_rate: number;
  };
  alerts: {
    unacknowledged: number;
    critical: number;
  };
}

export const useSystemHealth = () => {
  const [health, setHealth] = useState<SystemHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await RealTimeMonitoring.getHealthSummary();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return {
    health,
    loading,
    error,
    refresh: fetchHealth
  };
};
