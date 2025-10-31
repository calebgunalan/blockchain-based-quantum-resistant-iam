import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Shield, Users, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function LiveMonitoringDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    activeSessions: 0,
    failedLogins24h: 0,
    pendingJITRequests: 0,
    recentAttacks: 0,
    blockchainHealth: 100,
    avgTrustScore: 0,
    activeQuantumOps: 0,
  });

  const [loginAttempts, setLoginAttempts] = useState<Array<{ time: string; count: number }>>([]);
  const [trustDistribution, setTrustDistribution] = useState<Array<{ range: string; count: number }>>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{ id: string; action: string; user: string; time: string; severity: string }>>([]);

  useEffect(() => {
    if (user) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchMetrics = async () => {
    try {
      // Active sessions
      const { count: sessionsCount } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .is('expires_at', null);

      // Failed logins in last 24 hours
      const { data: failedLogins } = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('action', 'LOGIN_FAILED')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Pending JIT requests
      const { count: jitCount } = await supabase
        .from('jit_access_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Recent attacks
      const { count: attacksCount } = await supabase
        .from('quantum_attack_logs')
        .select('*', { count: 'exact', head: true })
        .gte('detected_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      // Average trust score (simulated for now)
      const avgTrust = 75;

      // Build login attempts timeline
      const loginTimeline: Array<{ time: string; count: number }> = [];
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(Date.now() - i * 60 * 60 * 1000).getHours();
        const hourStart = new Date(Date.now() - i * 60 * 60 * 1000).setMinutes(0, 0, 0);
        
        const count = failedLogins?.filter(log => {
          const logTime = new Date(log.created_at).getTime();
          return logTime >= hourStart && logTime < hourStart + 3600000;
        }).length || 0;

        loginTimeline.push({
          time: `${hour}:00`,
          count
        });
      }

      // Trust score distribution (simulated)
      const distribution = [
        { range: '0-20', count: 2 },
        { range: '21-40', count: 5 },
        { range: '41-60', count: 12 },
        { range: '61-80', count: 28 },
        { range: '81-100', count: 45 },
      ];

      // Recent activity
      const { data: recentLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const activities = recentLogs?.map(log => ({
        id: log.id,
        action: log.action,
        user: log.user_id?.substring(0, 8) || 'System',
        time: new Date(log.created_at).toLocaleTimeString(),
        severity: log.action.includes('ATTACK') || log.action.includes('FAILED') ? 'high' : 'normal'
      })) || [];

      setMetrics({
        activeSessions: sessionsCount || 0,
        failedLogins24h: failedLogins?.length || 0,
        pendingJITRequests: jitCount || 0,
        recentAttacks: attacksCount || 0,
        blockchainHealth: 100,
        avgTrustScore: Math.round(avgTrust),
        activeQuantumOps: Math.floor(Math.random() * 10), // Simulated
      });

      setLoginAttempts(loginTimeline);
      setTrustDistribution(distribution);
      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Security Monitoring</h1>
          <p className="text-muted-foreground">Real-time security events and metrics</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3" />
          Live Updates
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSessions}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.failedLogins24h}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending JIT Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingJITRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Trust Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgTrustScore}</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Failed Login Attempts (24h)</CardTitle>
            <CardDescription>Hourly breakdown of failed authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={loginAttempts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trust Score Distribution</CardTitle>
            <CardDescription>User trust score ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trustDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>Live feed of security-related activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <Shield className={`h-4 w-4 ${activity.severity === 'high' ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">User: {activity.user}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
