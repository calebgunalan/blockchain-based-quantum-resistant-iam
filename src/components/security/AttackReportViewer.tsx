import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

interface AttackLog {
  id: string;
  attack_type: string;
  target_resource: string | null;
  target_user_id: string | null;
  source_ip: string | null;
  attack_signature: string;
  severity: string;
  detection_method: string;
  is_blocked: boolean;
  metadata: any;
  detected_at: string;
}

export function AttackReportViewer() {
  const [attacks, setAttacks] = useState<AttackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttack, setSelectedAttack] = useState<AttackLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchAttacks();
  }, []);

  const fetchAttacks = async () => {
    try {
      const { data, error } = await supabase
        .from('quantum_attack_logs')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Transform data to match AttackLog type
      const transformedData: AttackLog[] = (data || []).map(d => ({
        id: d.id,
        attack_type: d.attack_type,
        target_resource: d.target_resource,
        target_user_id: d.target_user_id,
        source_ip: d.source_ip ? String(d.source_ip) : null,
        attack_signature: d.attack_signature,
        severity: d.severity,
        detection_method: d.detection_method,
        is_blocked: d.is_blocked,
        metadata: d.metadata,
        detected_at: d.detected_at
      }));
      
      setAttacks(transformedData);
    } catch (error) {
      console.error('Error fetching attacks:', error);
      toast.error('Failed to load attack logs');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const viewDetails = (attack: AttackLog) => {
    setSelectedAttack(attack);
    setDetailsOpen(true);
  };

  const downloadReport = () => {
    const csvContent = [
      ['Date', 'Attack Type', 'Severity', 'Source IP', 'Target', 'Status', 'Detection Method'].join(','),
      ...attacks.map(a => [
        new Date(a.detected_at).toLocaleString(),
        a.attack_type,
        a.severity,
        a.source_ip || 'N/A',
        a.target_resource || 'N/A',
        a.is_blocked ? 'Blocked' : 'Detected',
        a.detection_method
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attack-report-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Attack Detection Log
              </CardTitle>
              <CardDescription>
                Comprehensive log of all detected quantum-resistant attacks and simulations
              </CardDescription>
            </div>
            <Button onClick={downloadReport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading attack logs...</p>
            </div>
          ) : attacks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attacks detected yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Attack Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Source IP</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attacks.map((attack) => (
                  <TableRow key={attack.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(attack.detected_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{attack.attack_type}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(attack.severity)}>
                        {attack.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {attack.source_ip || 'Unknown'}
                    </TableCell>
                    <TableCell>{attack.target_resource || 'System'}</TableCell>
                    <TableCell>
                      <Badge variant={attack.is_blocked ? 'destructive' : 'secondary'}>
                        {attack.is_blocked ? 'Blocked' : 'Detected'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDetails(attack)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Attack Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about the detected attack
            </DialogDescription>
          </DialogHeader>
          {selectedAttack && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Attack Type</p>
                  <p className="text-sm font-semibold">{selectedAttack.attack_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Severity</p>
                  <Badge variant={getSeverityColor(selectedAttack.severity)}>
                    {selectedAttack.severity}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Detection Time</p>
                  <p className="text-sm">{new Date(selectedAttack.detected_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Detection Method</p>
                  <p className="text-sm">{selectedAttack.detection_method}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Source IP</p>
                  <p className="text-sm font-mono">{selectedAttack.source_ip || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={selectedAttack.is_blocked ? 'destructive' : 'secondary'}>
                    {selectedAttack.is_blocked ? 'Blocked' : 'Detected'}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Attack Signature</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded mt-1 break-all">
                    {selectedAttack.attack_signature}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Target Resource</p>
                  <p className="text-sm">{selectedAttack.target_resource || 'System-wide'}</p>
                </div>
                {selectedAttack.metadata && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Additional Metadata</p>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
                      {JSON.stringify(selectedAttack.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
