import { supabase } from '@/integrations/supabase/client';

// Type-safe wrapper to avoid deep instantiation errors
const db = supabase as any;

export interface SystemHealthMetric {
  metricName: string;
  metricValue: number;
  metricUnit?: string;
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

export interface SystemAlert {
  alertType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface IncidentReport {
  incidentType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  affectedSystems: string[];
}

/**
 * Real-Time System Monitoring
 * Tracks system health, performance, and incidents
 */
export class RealTimeMonitoring {
  /**
   * Record a system health metric
   */
  static async recordMetric(metric: SystemHealthMetric): Promise<boolean> {
    const { error } = await db
      .from('system_health_metrics')
      .insert({
        metric_name: metric.metricName,
        metric_value: metric.metricValue,
        metric_unit: metric.metricUnit,
        severity: metric.severity,
        metadata: metric.metadata || {}
      });

    if (error) {
      console.error('Failed to record metric:', error);
      return false;
    }

    // Auto-create alert for critical metrics
    if (metric.severity === 'critical') {
      await this.createAlert({
        alertType: 'metric_critical',
        severity: 'critical',
        message: `Critical metric detected: ${metric.metricName} = ${metric.metricValue}`,
        source: 'monitoring_system',
        metadata: metric.metadata
      });
    }

    return true;
  }

  /**
   * Create a system alert
   */
  static async createAlert(alert: SystemAlert): Promise<boolean> {
    const { error } = await db
      .from('system_alerts')
      .insert({
        alert_type: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        source: alert.source,
        metadata: alert.metadata || {}
      });

    return !error;
  }

  /**
   * Get system health summary
   */
  static async getHealthSummary() {
    const { data, error } = await db.rpc('get_system_health_summary');

    if (error) {
      console.error('Failed to get health summary:', error);
      return null;
    }

    return data;
  }

  /**
   * Get unacknowledged alerts
   */
  static async getUnacknowledgedAlerts() {
    const { data, error } = await db
      .from('system_alerts')
      .select('*')
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to get alerts:', error);
      return [];
    }

    return data;
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(alertId: string): Promise<boolean> {
    const { data: { user } } = await db.auth.getUser();
    
    const { error } = await db
      .from('system_alerts')
      .update({
        acknowledged: true,
        acknowledged_by: user?.id,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId);

    return !error;
  }

  /**
   * Create an incident report
   */
  static async createIncident(incident: IncidentReport): Promise<string | null> {
    const { data: { user } } = await db.auth.getUser();
    
    const { data, error } = await db
      .from('incident_logs')
      .insert({
        incident_type: incident.incidentType,
        severity: incident.severity,
        title: incident.title,
        description: incident.description,
        affected_systems: incident.affectedSystems,
        created_by: user?.id
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create incident:', error);
      return null;
    }

    return data.id;
  }

  /**
   * Update incident status
   */
  static async updateIncidentStatus(
    incidentId: string,
    status: 'open' | 'investigating' | 'resolved' | 'closed',
    resolutionNotes?: string
  ): Promise<boolean> {
    const updateData: any = { status };

    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
      if (resolutionNotes) {
        updateData.resolution_notes = resolutionNotes;
      }
    }

    const { error } = await db
      .from('incident_logs')
      .update(updateData)
      .eq('id', incidentId);

    return !error;
  }

  /**
   * Get recent incidents
   */
  static async getRecentIncidents(limit: number = 20) {
    const { data, error } = await db
      .from('incident_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get incidents:', error);
      return [];
    }

    return data;
  }

  /**
   * Record uptime check
   */
  static async recordUptimeCheck(
    serviceName: string,
    endpoint: string,
    isUp: boolean,
    responseTimeMs?: number,
    statusCode?: number,
    errorMessage?: string
  ): Promise<boolean> {
    const { error } = await db
      .from('uptime_checks')
      .insert({
        service_name: serviceName,
        endpoint,
        is_up: isUp,
        response_time_ms: responseTimeMs,
        status_code: statusCode,
        error_message: errorMessage
      });

    if (error) {
      console.error('Failed to record uptime check:', error);
      return false;
    }

    // Create alert if service is down
    if (!isUp) {
      await this.createAlert({
        alertType: 'service_down',
        severity: 'critical',
        message: `Service ${serviceName} is down: ${errorMessage || 'Unknown error'}`,
        source: 'uptime_monitor',
        metadata: { endpoint, statusCode }
      });
    }

    return true;
  }

  /**
   * Get uptime statistics
   */
  static async getUptimeStats(serviceName: string, hoursBack: number = 24) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hoursBack);

    const { data, error } = await db
      .from('uptime_checks')
      .select('*')
      .eq('service_name', serviceName)
      .gte('checked_at', cutoff.toISOString())
      .order('checked_at', { ascending: false });

    if (error || !data) {
      return {
        totalChecks: 0,
        upCount: 0,
        downCount: 0,
        uptimePercentage: 0,
        avgResponseTime: 0
      };
    }

    const upCount = data.filter(d => d.is_up).length;
    const responseTimes = data
      .filter(d => d.response_time_ms !== null)
      .map(d => d.response_time_ms!);

    return {
      totalChecks: data.length,
      upCount,
      downCount: data.length - upCount,
      uptimePercentage: (upCount / data.length) * 100,
      avgResponseTime: responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0
    };
  }

  /**
   * Monitor blockchain health
   */
  static async monitorBlockchainHealth(): Promise<void> {
    const { data: latestBlocks } = await db
      .from('blockchain_blocks')
      .select('*')
      .order('block_number', { ascending: false })
      .limit(10);
    
    if (!latestBlocks || latestBlocks.length === 0) {
      await this.createAlert({
        alertType: 'blockchain_stalled',
        severity: 'critical',
        message: 'No blocks found in blockchain',
        source: 'blockchain_monitor'
      });
      return;
    }

    // Check if blockchain is stalled
    const latestBlock = latestBlocks[0];
    const blockAge = Date.now() - new Date(latestBlock.created_at).getTime();
    const maxBlockAge = 60000; // 1 minute

    if (blockAge > maxBlockAge) {
      await this.createAlert({
        alertType: 'blockchain_stalled',
        severity: 'warning',
        message: `Blockchain appears stalled. Latest block is ${Math.round(blockAge / 1000)}s old`,
        source: 'blockchain_monitor',
        metadata: { blockIndex: latestBlock.block_index, blockAge }
      });
    }

    // Record blockchain height metric
    await this.recordMetric({
      metricName: 'blockchain_height',
      metricValue: latestBlock.block_index,
      metricUnit: 'blocks',
      severity: 'info'
    });
  }

  /**
   * Monitor P2P network health
   */
  static async monitorP2PHealth(): Promise<void> {
    const { data: peers } = await db
      .from('p2p_peers')
      .select('*')
      .eq('status', 'active');
    const peerCount = peers?.length || 0;
    const severity: 'info' | 'warning' | 'critical' = peerCount < 3 ? 'warning' : 'info';

    await this.recordMetric({
      metricName: 'p2p_active_peers',
      metricValue: peerCount,
      metricUnit: 'peers',
      severity
    });

    if (peerCount === 0) {
      await this.createAlert({
        alertType: 'p2p_no_peers',
        severity: 'critical',
        message: 'No active P2P peers connected',
        source: 'p2p_monitor'
      });
    }
  }

  /**
   * Monitor mempool health
   */
  static async monitorMempoolHealth(): Promise<void> {
    const { data: mempool } = await db
      .from('blockchain_mempool')
      .select('*')
      .eq('status', 'pending');
    const pendingCount = mempool?.length || 0;
    const severity: 'info' | 'warning' | 'critical' = pendingCount > 1000 ? 'warning' : 'info';

    await this.recordMetric({
      metricName: 'mempool_size',
      metricValue: pendingCount,
      metricUnit: 'transactions',
      severity
    });

    if (pendingCount > 10000) {
      await this.createAlert({
        alertType: 'mempool_congestion',
        severity: 'warning',
        message: `Mempool congested with ${pendingCount} pending transactions`,
        source: 'mempool_monitor'
      });
    }
  }

  /**
   * Run all health checks
   */
  static async runAllHealthChecks(): Promise<void> {
    const checks: Promise<void>[] = [
      this.monitorBlockchainHealth(),
      this.monitorP2PHealth(),
      this.monitorMempoolHealth()
    ];
    await Promise.all(checks);
  }
}
