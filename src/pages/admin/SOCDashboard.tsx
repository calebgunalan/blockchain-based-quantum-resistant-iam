import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/PermissionGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Shield, AlertTriangle, Activity, Zap, Eye, RefreshCw, Terminal, Lock } from "lucide-react";
import { getRecentExecutions, PLAYBOOK_METADATA, executePlaybook } from "@/lib/incident-playbooks";
import { computeThreatFactor } from "@/lib/dual-layer-consensus";
import { toast } from "sonner";

export default function SOCDashboard() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [attackLogs, setAttackLogs] = useState<any[]>([]);
  const [playbookExecutions, setPlaybookExecutions] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [threatLevel, setThreatLevel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const liveLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || userRole !== 'admin') { navigate('/dashboard'); return; }
    loadAll();
    const interval = setInterval(loadAll, 15000);
    
    // Supabase Realtime for live alerts
    const alertChannel = supabase
      .channel('soc-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_alerts' }, (payload) => {
        setAlerts(prev => [payload.new, ...prev].slice(0, 100));
        toast.error(`🚨 New Alert: ${(payload.new as any).message?.slice(0, 60)}`);
        scrollLiveLogs();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attack_simulation_logs' }, (payload) => {
        setAttackLogs(prev => [payload.new, ...prev].slice(0, 100));
        scrollLiveLogs();
      })
      .subscribe();

    return () => { clearInterval(interval); supabase.removeChannel(alertChannel); };
  }, [user, userRole]);

  const scrollLiveLogs = () => {
    if (liveLogRef.current) liveLogRef.current.scrollTop = 0;
  };

  const loadAll = async () => {
    const [alertsRes, attacksRes, sessionsRes, execRes, threat] = await Promise.all([
      supabase.from('system_alerts').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('attack_simulation_logs').select('*').order('detected_at', { ascending: false }).limit(50),
      supabase.from('user_sessions').select('user_id, last_activity, ip_address, location_country').eq('is_active', true).limit(30),
      getRecentExecutions(20),
      computeThreatFactor(),
    ]);
    setAlerts(alertsRes.data || []);
    setAttackLogs(attacksRes.data || []);
    setActiveSessions(sessionsRes.data || []);
    setPlaybookExecutions(execRes as any[]);
    setThreatLevel(threat);
    setLoading(false);
    setLastRefresh(new Date());
  };

  const triggerPlaybook = async (name: any) => {
    toast.loading(`Executing playbook: ${name}...`);
    await executePlaybook(name, 'MANUAL_SOC_TRIGGER', { triggered_by: user?.id });
    toast.success(`Playbook ${name} executed`);
    await loadAll();
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const unblocked = attackLogs.filter(a => !a.blocked);
  const attackSeverityData = ['critical', 'high', 'medium', 'low'].map(s => ({
    name: s, count: attackLogs.filter(a => a.severity === s).length,
  }));
  const COLORS = ['hsl(var(--destructive))', 'hsl(var(--chart-4))', 'hsl(var(--chart-2))', 'hsl(var(--muted-foreground))'];

  const threatColor = threatLevel?.level === 'critical' ? 'destructive' : threatLevel?.level === 'high' ? 'secondary' : 'default';
  const threatPct = Math.round((threatLevel?.factor || 0.51) * 100);

  if (!user || userRole !== 'admin') return null;

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-destructive" /> Security Operations Center
          </h1>
          <p className="text-muted-foreground mt-1">Live threat monitoring • DLCAF consensus • BASC session integrity</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Last: {lastRefresh.toLocaleTimeString()}</span>
          <Button size="sm" variant="outline" onClick={loadAll}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Threat Status Bar */}
      <Card className="border-destructive/30">
        <CardContent className="pt-4">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">DLCAF Adaptive Threat Factor</span>
                <Badge variant={threatColor}>{threatLevel?.level?.toUpperCase() || 'NORMAL'} — {threatPct}%</Badge>
              </div>
              <Progress value={threatPct} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                Quorum threshold: ≥{Math.ceil(1 * (threatLevel?.factor || 0.51) * 100)}% of validators required for block finality
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-destructive">{criticalAlerts.length}</p>
                <p className="text-xs text-muted-foreground">Critical Alerts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-chart-4">{unblocked.length}</p>
                <p className="text-xs text-muted-foreground">Unblocked Attacks</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSessions.length}</p>
                <p className="text-xs text-muted-foreground">Active Sessions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live"><Activity className="h-4 w-4 mr-1" />Live Feed</TabsTrigger>
          <TabsTrigger value="attacks"><AlertTriangle className="h-4 w-4 mr-1" />Attacks</TabsTrigger>
          <TabsTrigger value="playbooks"><Terminal className="h-4 w-4 mr-1" />Playbooks</TabsTrigger>
          <TabsTrigger value="sessions"><Eye className="h-4 w-4 mr-1" />Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Live Alert Stream</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-80" ref={liveLogRef as any}>
                  {alerts.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">No alerts — system nominal</p>
                  ) : alerts.map((a, i) => (
                    <div key={a.id || i} className="flex items-start gap-2 py-2 border-b last:border-0">
                      <Badge variant={a.severity === 'critical' ? 'destructive' : 'secondary'} className="shrink-0 text-xs">
                        {a.severity}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{a.message || a.alert_type}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleTimeString()}</p>
                      </div>
                      {!a.acknowledged && <div className="h-2 w-2 rounded-full bg-destructive shrink-0 mt-1" />}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Attack Severity Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={attackSeverityData} cx="50%" cy="50%" outerRadius={100} dataKey="count" label={({ name, count }) => count > 0 ? `${name}: ${count}` : ''}>
                      {attackSeverityData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attacks">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attack Simulation Logs</CardTitle>
              <CardDescription>{attackLogs.length} events in last 24h</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={attackSeverityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <ScrollArea className="h-60 mt-4">
                {attackLogs.map((a, i) => (
                  <div key={a.id || i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <span className="text-sm font-mono">{a.attack_type}</span>
                      <span className="text-xs text-muted-foreground ml-2">{a.target_resource || 'system'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.blocked ? 'default' : 'destructive'} className="text-xs">
                        {a.blocked ? 'BLOCKED' : 'UNBLOCKED'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{a.severity}</Badge>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playbooks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PLAYBOOK_METADATA).map(([name, meta]) => (
              <Card key={name} className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono">{name}</CardTitle>
                    <Badge variant={meta.severity === 'critical' ? 'destructive' : meta.severity === 'high' ? 'secondary' : 'default'} className="text-xs">
                      {meta.severity}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{meta.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 mb-3">
                    {meta.actions.map(a => (
                      <div key={a} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Zap className="h-3 w-3" /> {a}
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => triggerPlaybook(name)}>
                    <Terminal className="h-3 w-3 mr-1" /> Trigger Manually
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {playbookExecutions.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Recent Executions</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-60">
                  {playbookExecutions.map((e: any, i) => (
                    <div key={e.id || i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <span className="text-sm font-mono">{e.playbook_name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{e.trigger_event}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={e.status === 'executed' ? 'default' : 'destructive'} className="text-xs">{e.status}</Badge>
                        <span className="text-xs text-muted-foreground">{e.execution_time_ms}ms</span>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active Session BASC Monitor</CardTitle>
              <CardDescription>Blockchain-Anchored Session Continuity — real-time chain integrity</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                {activeSessions.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No active sessions</p>
                ) : activeSessions.map((s, i) => (
                  <div key={s.user_id + i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-xs font-mono truncate w-48">{s.user_id}</p>
                      <p className="text-xs text-muted-foreground">{s.location_country || 'Unknown'} · {new Date(s.last_activity).toLocaleTimeString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-3 w-3 text-primary" />
                      <Badge variant="default" className="text-xs">BASC Active</Badge>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
