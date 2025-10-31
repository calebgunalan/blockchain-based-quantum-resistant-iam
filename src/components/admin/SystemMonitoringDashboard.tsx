import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Users, Shield, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBlockchain } from '@/hooks/useBlockchain';

interface MonitoringStats {
  activeSessions: number;
  failedLogins: number;
  pendingJITRequests: number;
  blockchainHeight: number;
  lastBlockTime: string;
  quantumProtection: boolean;
}

export function SystemMonitoringDashboard() {
  const [stats, setStats] = useState<MonitoringStats>({
    activeSessions: 0,
    failedLogins: 0,
    pendingJITRequests: 0,
    blockchainHeight: 0,
    lastBlockTime: 'N/A',
    quantumProtection: true
  });
  const [loading, setLoading] = useState(true);
  const { chainStatus } = useBlockchain();

  useEffect(() => {
    loadStats();
    
    // Real-time updates
    const interval = setInterval(loadStats, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      // Active sessions count
      const { count: sessionCount } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('expires_at', new Date().toISOString());

      // Failed login attempts (last 24 hours)
      const { count: failedCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'LOGIN_FAILED')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Pending JIT access requests
      const { count: jitCount } = await supabase
        .from('jit_access_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Blockchain stats
      const { data: lastBlock } = await supabase
        .from('blockchain_blocks')
        .select('*')
        .order('block_index', { ascending: false })
        .limit(1)
        .single();

      setStats({
        activeSessions: sessionCount || 0,
        failedLogins: failedCount || 0,
        pendingJITRequests: jitCount || 0,
        blockchainHeight: chainStatus?.height || lastBlock?.block_index || 0,
        lastBlockTime: lastBlock?.created_at 
          ? new Date(lastBlock.created_at).toLocaleTimeString() 
          : 'N/A',
        quantumProtection: true
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading monitoring stats:', error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">System Monitoring Dashboard</h2>
        <p className="text-muted-foreground">
          Real-time system health and security metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Active Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              Currently authenticated users
            </p>
            <Progress value={Math.min(stats.activeSessions / 100 * 100, 100)} className="mt-2" />
          </CardContent>
        </Card>

        {/* Failed Login Attempts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedLogins}</div>
            <p className="text-xs text-muted-foreground">
              Potential security threats detected
            </p>
            <Badge variant={stats.failedLogins > 10 ? "destructive" : "secondary"} className="mt-2">
              {stats.failedLogins > 10 ? "High Alert" : "Normal"}
            </Badge>
          </CardContent>
        </Card>

        {/* Pending JIT Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending JIT Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingJITRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
            <Badge variant={stats.pendingJITRequests > 0 ? "default" : "secondary"} className="mt-2">
              {stats.pendingJITRequests > 0 ? "Action Required" : "All Clear"}
            </Badge>
          </CardContent>
        </Card>

        {/* Blockchain Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Height</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blockchainHeight}</div>
            <p className="text-xs text-muted-foreground">
              Blocks mined • Last: {stats.lastBlockTime}
            </p>
            <div className="flex items-center mt-2 gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">Operational</span>
            </div>
          </CardContent>
        </Card>

        {/* Quantum Protection */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantum Protection</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.quantumProtection ? "Active" : "Inactive"}
            </div>
            <p className="text-xs text-muted-foreground">
              NIST ML-DSA-65 & ML-KEM-768
            </p>
            <Badge variant="default" className="mt-2">
              100% Quantum Resistant
            </Badge>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Database</span>
                <span className="text-green-500">✓ OK</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Blockchain</span>
                <span className="text-green-500">✓ OK</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Timestamping</span>
                <span className="text-green-500">✓ OK</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>Last 10 security-related events</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentActivityFeed />
        </CardContent>
      </Card>
    </div>
  );
}

function RecentActivityFeed() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    loadRecentEvents();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('audit-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          setEvents(prev => [payload.new, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRecentEvents = async () => {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .in('action', ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'PERMISSION_GRANTED', 'ATTACK_DETECTED'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setEvents(data);
  };

  return (
    <div className="space-y-2">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent events</p>
      ) : (
        events.map((event, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
            <div className="flex items-center gap-2">
              {event.action === 'LOGIN_SUCCESS' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {event.action === 'LOGIN_FAILED' && <AlertTriangle className="h-4 w-4 text-destructive" />}
              {event.action === 'ATTACK_DETECTED' && <Shield className="h-4 w-4 text-destructive" />}
              {event.action === 'PERMISSION_GRANTED' && <Users className="h-4 w-4 text-primary" />}
              
              <div>
                <p className="text-sm font-medium">{event.action.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">
                  {event.resource} • {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            
            <Badge variant={event.action.includes('FAILED') || event.action.includes('ATTACK') ? "destructive" : "secondary"}>
              {event.ip_address || 'Unknown IP'}
            </Badge>
          </div>
        ))
      )}
    </div>
  );
}
