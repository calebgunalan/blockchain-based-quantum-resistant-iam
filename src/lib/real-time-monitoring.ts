/**
 * Real-Time Monitoring System using Supabase Realtime
 * Provides WebSocket-based live updates for security events
 */

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type MonitoringEventType = 
  | 'LOGIN_ATTEMPT'
  | 'ACCESS_DENIED'
  | 'ATTACK_DETECTED'
  | 'SESSION_STARTED'
  | 'SESSION_ENDED'
  | 'POLICY_VIOLATION'
  | 'BLOCKCHAIN_EVENT'
  | 'QUANTUM_OPERATION';

export interface MonitoringEvent {
  id: string;
  type: MonitoringEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface SubscriptionOptions {
  userId?: string;
  eventTypes?: MonitoringEventType[];
  minSeverity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Real-Time Monitoring Manager
 */
export class RealTimeMonitoring {
  private channels: Map<string, RealtimeChannel> = new Map();
  private eventHandlers: Map<string, Set<(event: MonitoringEvent) => void>> = new Map();

  /**
   * Subscribe to audit log changes
   */
  subscribeToAuditLogs(
    callback: (event: MonitoringEvent) => void,
    options: SubscriptionOptions = {}
  ): () => void {
    const channelId = `audit-logs-${Date.now()}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: options.userId ? `user_id=eq.${options.userId}` : undefined
        },
        (payload) => {
          const event: MonitoringEvent = {
            id: payload.new.id,
            type: this.mapActionToEventType(payload.new.action),
            severity: this.determineSeverity(payload.new.action),
            userId: payload.new.user_id,
            timestamp: payload.new.created_at,
            data: payload.new
          };

          if (this.shouldNotify(event, options)) {
            callback(event);
          }
        }
      )
      .subscribe();

    this.channels.set(channelId, channel);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      this.channels.delete(channelId);
    };
  }

  /**
   * Subscribe to attack detection events
   */
  subscribeToAttacks(
    callback: (event: MonitoringEvent) => void
  ): () => void {
    const channelId = `attacks-${Date.now()}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quantum_attack_logs'
        },
        (payload) => {
          const event: MonitoringEvent = {
            id: payload.new.id,
            type: 'ATTACK_DETECTED',
            severity: payload.new.severity || 'high',
            userId: payload.new.target_user_id,
            timestamp: payload.new.detected_at,
            data: payload.new
          };

          callback(event);
        }
      )
      .subscribe();

    this.channels.set(channelId, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelId);
    };
  }

  /**
   * Subscribe to session changes
   */
  subscribeToSessions(
    callback: (event: MonitoringEvent) => void,
    userId?: string
  ): () => void {
    const channelId = `sessions-${Date.now()}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
          filter: userId ? `user_id=eq.${userId}` : undefined
        },
        (payload) => {
          const isInsert = payload.eventType === 'INSERT';
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          const event: MonitoringEvent = {
            id: newData?.id || oldData?.id || 'unknown',
            type: isInsert ? 'SESSION_STARTED' : 'SESSION_ENDED',
            severity: 'low',
            userId: newData?.user_id || oldData?.user_id,
            timestamp: new Date().toISOString(),
            data: payload
          };

          callback(event);
        }
      )
      .subscribe();

    this.channels.set(channelId, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelId);
    };
  }

  /**
   * Subscribe to blockchain events
   */
  subscribeToBlockchain(
    callback: (event: MonitoringEvent) => void
  ): () => void {
    const channelId = `blockchain-${Date.now()}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blockchain_blocks'
        },
        (payload) => {
          const event: MonitoringEvent = {
            id: payload.new.id,
            type: 'BLOCKCHAIN_EVENT',
            severity: 'low',
            timestamp: payload.new.created_at,
            data: {
              block_index: payload.new.block_index,
              block_hash: payload.new.block_hash,
              transaction_count: payload.new.transaction_count
            }
          };

          callback(event);
        }
      )
      .subscribe();

    this.channels.set(channelId, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelId);
    };
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    for (const [channelId, channel] of this.channels.entries()) {
      channel.unsubscribe();
      this.channels.delete(channelId);
    }
  }

  /**
   * Map action string to event type
   */
  private mapActionToEventType(action: string): MonitoringEventType {
    if (action.includes('LOGIN')) return 'LOGIN_ATTEMPT';
    if (action.includes('DENIED')) return 'ACCESS_DENIED';
    if (action.includes('ATTACK')) return 'ATTACK_DETECTED';
    if (action.includes('QUANTUM')) return 'QUANTUM_OPERATION';
    if (action.includes('BLOCKCHAIN')) return 'BLOCKCHAIN_EVENT';
    return 'LOGIN_ATTEMPT';
  }

  /**
   * Determine severity from action
   */
  private determineSeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
    if (action.includes('ATTACK') || action.includes('CRITICAL')) return 'critical';
    if (action.includes('FAILED') || action.includes('DENIED')) return 'high';
    if (action.includes('WARNING')) return 'medium';
    return 'low';
  }

  /**
   * Check if event should be notified based on options
   */
  private shouldNotify(event: MonitoringEvent, options: SubscriptionOptions): boolean {
    if (options.eventTypes && !options.eventTypes.includes(event.type)) {
      return false;
    }

    if (options.minSeverity) {
      const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
      if (severityLevels[event.severity] < severityLevels[options.minSeverity]) {
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const realTimeMonitoring = new RealTimeMonitoring();
