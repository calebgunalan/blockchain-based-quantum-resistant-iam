import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RealTimeMonitoring } from '@/lib/real-time-monitoring';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Server,
  Zap,
  TrendingUp
} from 'lucide-react';

export function LiveMonitoringDashboard() {
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [summary, alertsData, incidentsData] = await Promise.all([
        RealTimeMonitoring.getHealthSummary(),
        RealTimeMonitoring.getUnacknowledgedAlerts(),
        RealTimeMonitoring.getRecentIncidents(10)
      ]);

      setHealthSummary(summary);
      setAlerts(alertsData);
      setIncidents(incidentsData);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading monitoring data',
        description: 'Please try again later'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = async (alertId: string) => {
    const success = await RealTimeMonitoring.acknowledgeAlert(alertId);
    if (success) {
      toast({
        title: 'Alert acknowledged',
        description: 'The alert has been marked as acknowledged'
      });
      loadData();
    }
  };

  const runHealthChecks = async () => {
    toast({
      title: 'Running health checks',
      description: 'System health checks are being performed...'
    });
    
    await RealTimeMonitoring.runAllHealthChecks();
    
    setTimeout(() => {
      loadData();
      toast({
        title: 'Health checks complete',
        description: 'System health has been updated'
      });
    }, 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
      case 'high':
        return 'default';
      case 'info':
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Live System Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time system health and performance metrics
          </p>
        </div>
        <Button onClick={runHealthChecks}>
          <Activity className="mr-2 h-4 w-4" />
          Run Health Checks
        </Button>
      </div>

      {/* Critical Alerts */}
      {alerts.filter(a => a.severity === 'critical').length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {alerts.filter(a => a.severity === 'critical').length} critical alert(s) require immediate attention
          </AlertDescription>
        </Alert>
      )}

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthSummary?.blockchain?.latest_block || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Latest block • {healthSummary?.blockchain?.avg_block_time || 0}s avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P2P Network</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthSummary?.p2p_network?.active_peers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active peers • {healthSummary?.p2p_network?.avg_reputation || 0} avg rep
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mempool</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthSummary?.mempool?.pending_transactions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthSummary?.alerts?.unacknowledged || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthSummary?.alerts?.critical || 0} critical
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">
            Alerts ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="incidents">
            Incidents ({incidents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Unacknowledged alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No unacknowledged alerts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">{alert.alert_type}</Badge>
                        </div>
                        <p className="font-medium mb-1">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">
                          Source: {alert.source} • {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Log</CardTitle>
              <CardDescription>
                Recent system incidents and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No recent incidents</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                          <Badge variant="outline">{incident.status}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(incident.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-1">{incident.title}</h4>
                      {incident.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {incident.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Affected:</span>
                        {incident.affected_systems?.map((system: string) => (
                          <Badge key={system} variant="secondary">
                            {system}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
