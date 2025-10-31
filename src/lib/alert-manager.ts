/**
 * Alert Management System
 * Handles critical security events and notifications
 */

import { toast } from '@/hooks/use-toast';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertCategory = 'security' | 'anomaly' | 'policy' | 'blockchain' | 'quantum';

export interface SecurityAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  timestamp: Date;
  metadata: Record<string, any>;
  acknowledged: boolean;
  actionRequired: boolean;
  actions?: AlertAction[];
}

export interface AlertAction {
  label: string;
  action: () => void | Promise<void>;
  variant?: 'default' | 'destructive' | 'outline';
}

/**
 * Alert Manager
 */
export class AlertManager {
  private static alerts: Map<string, SecurityAlert> = new Map();
  private static listeners: Set<(alert: SecurityAlert) => void> = new Set();

  /**
   * Create and dispatch a security alert
   */
  static createAlert(
    severity: AlertSeverity,
    category: AlertCategory,
    title: string,
    message: string,
    metadata: Record<string, any> = {},
    actions?: AlertAction[]
  ): string {
    const alert: SecurityAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      severity,
      category,
      title,
      message,
      timestamp: new Date(),
      metadata,
      acknowledged: false,
      actionRequired: actions ? actions.length > 0 : false,
      actions
    };

    this.alerts.set(alert.id, alert);

    // Notify listeners
    this.listeners.forEach(listener => listener(alert));

    // Show toast notification
    this.showToast(alert);

    return alert.id;
  }

  /**
   * Create critical security event alert
   */
  static alertCriticalEvent(
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ): string {
    return this.createAlert('critical', 'security', title, message, metadata);
  }

  /**
   * Create anomaly detection alert
   */
  static alertAnomaly(
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ): string {
    return this.createAlert('warning', 'anomaly', title, message, metadata);
  }

  /**
   * Create policy violation alert
   */
  static alertPolicyViolation(
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ): string {
    return this.createAlert('error', 'policy', title, message, metadata);
  }

  /**
   * Create blockchain integrity alert
   */
  static alertBlockchainIssue(
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ): string {
    return this.createAlert('error', 'blockchain', title, message, metadata);
  }

  /**
   * Create quantum security alert
   */
  static alertQuantumThreat(
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ): string {
    return this.createAlert('critical', 'quantum', title, message, metadata);
  }

  /**
   * Acknowledge an alert
   */
  static acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.alerts.set(alertId, alert);
    }
  }

  /**
   * Get all active alerts
   */
  static getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get alerts by severity
   */
  static getAlertsBySeverity(severity: AlertSeverity): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.severity === severity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get alerts by category
   */
  static getAlertsByCategory(category: AlertCategory): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.category === category)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Subscribe to alert events
   */
  static subscribe(listener: (alert: SecurityAlert) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clear acknowledged alerts older than specified time
   */
  static clearOldAlerts(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.acknowledged && alert.timestamp < cutoffTime) {
        this.alerts.delete(id);
      }
    }
  }

  /**
   * Get alert statistics
   */
  static getStatistics() {
    const alerts = Array.from(this.alerts.values());
    return {
      total: alerts.length,
      active: alerts.filter(a => !a.acknowledged).length,
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        error: alerts.filter(a => a.severity === 'error').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      },
      byCategory: {
        security: alerts.filter(a => a.category === 'security').length,
        anomaly: alerts.filter(a => a.category === 'anomaly').length,
        policy: alerts.filter(a => a.category === 'policy').length,
        blockchain: alerts.filter(a => a.category === 'blockchain').length,
        quantum: alerts.filter(a => a.category === 'quantum').length
      }
    };
  }

  /**
   * Show toast notification for alert
   */
  private static showToast(alert: SecurityAlert): void {
    const variant = alert.severity === 'critical' || alert.severity === 'error' 
      ? 'destructive' 
      : 'default';

    toast({
      variant,
      title: alert.title,
      description: alert.message
    });
  }
}
