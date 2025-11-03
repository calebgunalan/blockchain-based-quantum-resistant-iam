import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';
import { Activity, AlertTriangle, Database, Network, Shield, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const SystemHealthOverview = () => {
  const { health, loading: healthLoading } = useSystemHealth();
  const { criticalAlerts, warningAlerts } = useSystemAlerts();

  if (healthLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getHealthStatus = () => {
    if (criticalAlerts.length > 0) return { label: 'Critical', variant: 'destructive' as const };
    if (warningAlerts.length > 0) return { label: 'Warning', variant: 'secondary' as const };
    return { label: 'Healthy', variant: 'default' as const };
  };

  const status = getHealthStatus();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Health</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.blockchain?.latest_block || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {health?.blockchain?.total_blocks || 0} total blocks
            </p>
            <p className="text-xs text-muted-foreground">
              Avg: {health?.blockchain?.avg_block_time?.toFixed(2) || 0}s/block
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P2P Network</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.p2p_network?.active_peers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active peers
            </p>
            <p className="text-xs text-muted-foreground">
              Avg reputation: {health?.p2p_network?.avg_reputation?.toFixed(1) || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mempool</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.mempool?.pending_transactions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending transactions
            </p>
            <p className="text-xs text-muted-foreground">
              Total fees: {health?.mempool?.total_fees || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantum Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.quantum_security?.active_keys || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active keys
            </p>
            <p className="text-xs text-muted-foreground">
              Cache hit: {health?.quantum_security?.cache_hit_rate?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Active Alerts
            </CardTitle>
            <CardDescription>
              {criticalAlerts.length} critical, {warningAlerts.length} warnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 3).map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-destructive">{alert.message}</span>
                  <Badge variant="destructive">{alert.severity}</Badge>
                </div>
              ))}
              {warningAlerts.slice(0, 2).map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{alert.message}</span>
                  <Badge variant="secondary">{alert.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
