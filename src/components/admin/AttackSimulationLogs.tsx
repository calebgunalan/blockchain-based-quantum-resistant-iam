import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, AlertTriangle, CheckCircle, X, Eye, Zap, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface AttackLog {
  id: string;
  attack_type: string;
  target_resource: string | null;
  attack_payload: any;
  system_response: any;
  blocked: boolean;
  severity: string;
  quantum_protected: boolean;
  source_ip: string | null;
  user_agent: string | null;
  detected_at: string;
  response_time_ms: number | null;
  mitigation_actions: string[];
}

export function AttackSimulationLogs() {
  const [logs, setLogs] = useState<AttackLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AttackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [blockedFilter, setBlockedFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AttackLog | null>(null);

  useEffect(() => {
    fetchAttackLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.attack_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target_resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source_ip?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    if (blockedFilter !== 'all') {
      filtered = filtered.filter(log => log.blocked === (blockedFilter === 'blocked'));
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, severityFilter, blockedFilter]);

  const fetchAttackLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('attack_simulation_logs')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setLogs((data || []).map(log => ({
        ...log,
        attack_payload: log.attack_payload as any,
        system_response: log.system_response as any,
        mitigation_actions: (log.mitigation_actions as any) || [],
        source_ip: log.source_ip as string | null,
        user_agent: log.user_agent as string | null,
        response_time_ms: log.response_time_ms as number | null
      })));
      setFilteredLogs((data || []).map(log => ({
        ...log,
        attack_payload: log.attack_payload as any,
        system_response: log.system_response as any,
        mitigation_actions: (log.mitigation_actions as any) || [],
        source_ip: log.source_ip as string | null,
        user_agent: log.user_agent as string | null,
        response_time_ms: log.response_time_ms as number | null
      })));
    } catch (error) {
      console.error('Error fetching attack logs:', error);
      toast.error('Failed to fetch attack simulation logs');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-3 w-3" />;
      case 'medium':
        return <Shield className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getBlockedIcon = (blocked: boolean) => {
    return blocked ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-red-500" />
    );
  };

  const formatPayload = (payload: any) => {
    return JSON.stringify(payload, null, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Attack Simulation Logs</span>
            </CardTitle>
            <CardDescription>
              View simulated quantum attacks and system responses for security testing
            </CardDescription>
          </div>
          <Button onClick={fetchAttackLogs} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Input
              placeholder="Search attacks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={blockedFilter} onValueChange={setBlockedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All attacks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Attacks</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="allowed">Allowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Attack Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Attacks</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked</p>
                <p className="text-2xl font-bold text-green-600">
                  {logs.filter(log => log.blocked).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quantum Protected</p>
                <p className="text-2xl font-bold text-blue-600">
                  {logs.filter(log => log.quantum_protected).length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">
                  {logs.length > 0 
                    ? Math.round(logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / logs.length)
                    : 0}ms
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Attack Logs */}
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={getSeverityColor(log.severity)} className="flex items-center gap-1">
                      {getSeverityIcon(log.severity)}
                      {log.severity.toUpperCase()}
                    </Badge>
                    <span className="font-medium text-lg">{log.attack_type}</span>
                    {getBlockedIcon(log.blocked)}
                    {log.quantum_protected && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Quantum Protected
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                    <div>
                      <span className="font-medium">Target:</span> {log.target_resource || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Source:</span> {log.source_ip || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Response Time:</span> {log.response_time_ms || 0}ms
                    </div>
                    <div>
                      <span className="font-medium">Detected:</span> {' '}
                      {formatDistanceToNow(new Date(log.detected_at), { addSuffix: true })}
                    </div>
                  </div>

                  {log.mitigation_actions && log.mitigation_actions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {log.mitigation_actions.map((action, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Attack Details - {log.attack_type}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Attack Information</h4>
                          <div className="space-y-1 text-sm">
                            <div><strong>Type:</strong> {log.attack_type}</div>
                            <div><strong>Target:</strong> {log.target_resource || 'N/A'}</div>
                            <div><strong>Severity:</strong> {log.severity}</div>
                            <div><strong>Blocked:</strong> {log.blocked ? 'Yes' : 'No'}</div>
                            <div><strong>Quantum Protected:</strong> {log.quantum_protected ? 'Yes' : 'No'}</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Source Information</h4>
                          <div className="space-y-1 text-sm">
                            <div><strong>IP Address:</strong> {log.source_ip || 'N/A'}</div>
                            <div><strong>User Agent:</strong> {log.user_agent || 'N/A'}</div>
                            <div><strong>Response Time:</strong> {log.response_time_ms || 0}ms</div>
                            <div><strong>Detected:</strong> {new Date(log.detected_at).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Attack Payload</h4>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                          {formatPayload(log.attack_payload)}
                        </pre>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">System Response</h4>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                          {formatPayload(log.system_response)}
                        </pre>
                      </div>
                      
                      {log.mitigation_actions && log.mitigation_actions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Mitigation Actions</h4>
                          <div className="flex flex-wrap gap-2">
                            {log.mitigation_actions.map((action, index) => (
                              <Badge key={index} variant="secondary">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No attack simulation logs found matching your criteria.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}