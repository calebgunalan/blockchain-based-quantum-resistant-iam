/**
 * Enhanced Blockchain Dashboard
 * Phase 2: Displays blockchain statistics, W3C VC exports, and audit reports
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Download, 
  CheckCircle, 
  Clock, 
  Database,
  FileText,
  Lock,
  TrendingUp
} from 'lucide-react';
import { BlockchainIntegrationManager } from '@/lib/enhanced-quantum-blockchain-integration';
import { toast } from '@/hooks/use-toast';

export default function EnhancedBlockchainDashboard() {
  const [manager] = useState(() => new BlockchainIntegrationManager());
  const [stats, setStats] = useState<any>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      await manager.initialize();
      const statistics = manager.getStatistics();
      const valid = await manager.verifyIntegrity();
      
      setStats(statistics);
      setIsValid(valid);
    } catch (error) {
      console.error('Failed to initialize blockchain dashboard:', error);
      toast({
        title: 'Initialization Error',
        description: 'Failed to load blockchain data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportAuditReport = async () => {
    try {
      const report = await manager.exportAuditReport();
      const blob = new Blob([report], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blockchain-audit-report-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: 'Audit report downloaded successfully'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to generate audit report',
        variant: 'destructive'
      });
    }
  };

  const handleExportVerifiableCredentials = () => {
    try {
      const vcs = manager.exportVerifiableCredentials();
      const blob = new Blob([JSON.stringify(vcs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `w3c-verifiable-credentials-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: 'W3C Verifiable Credentials downloaded'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export credentials',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading blockchain data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Enhanced Quantum Blockchain</h2>
        <p className="text-muted-foreground">
          Production-ready blockchain with ML-DSA signatures and external timestamping
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chain Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isValid ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">Valid</span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold text-destructive">Invalid</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Blockchain integrity verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blocks</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBlocks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Including genesis block
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantum Protected</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.quantumProtected || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ML-DSA signed blocks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timestamped</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.externallyTimestamped || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              External timestamp proofs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="export">Export & Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Features</CardTitle>
              <CardDescription>
                Production-ready features implemented in Phase 2
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">ML-DSA-65 Digital Signatures</h4>
                  <p className="text-sm text-muted-foreground">
                    NIST-standardized post-quantum signatures on every block
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">External Timestamping</h4>
                  <p className="text-sm text-muted-foreground">
                    Cryptographic timestamp proofs for third-party verification
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">W3C Verifiable Credentials</h4>
                  <p className="text-sm text-muted-foreground">
                    Industry-standard JSON-LD format for audit reports
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Immutable Audit Trail</h4>
                  <p className="text-sm text-muted-foreground">
                    Cryptographically verifiable history of all operations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Statistics</CardTitle>
              <CardDescription>
                Detailed metrics and performance data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{stats?.totalTransactions || 0}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mining Difficulty</p>
                  <p className="text-2xl font-bold">{stats?.difficulty || 0}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Block Time</p>
                  <p className="text-2xl font-bold">
                    {stats?.averageBlockTime ? `${Math.round(stats.averageBlockTime / 1000)}s` : 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chain Valid</p>
                  <Badge variant={isValid ? 'default' : 'destructive'}>
                    {isValid ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Security Features</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quantum-Protected Blocks</span>
                    <Badge>{stats?.quantumProtected || 0} / {stats?.totalBlocks || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Externally Timestamped</span>
                    <Badge>{stats?.externallyTimestamped || 0} / {stats?.totalBlocks || 0}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export & Audit Reports</CardTitle>
              <CardDescription>
                Generate compliance and audit documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button 
                  onClick={handleExportAuditReport}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export Comprehensive Audit Report
                </Button>

                <Button 
                  onClick={handleExportVerifiableCredentials}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export W3C Verifiable Credentials
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Export Formats</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Audit Report: Comprehensive JSON with all blockchain data</p>
                    <p>• W3C VC: Industry-standard JSON-LD format</p>
                    <p>• Includes: Block hashes, signatures, timestamps, and transaction data</p>
                    <p>• Suitable for: Compliance audits, third-party verification</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
