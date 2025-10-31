import { useEffect } from 'react';
import { useBlockchain } from '@/hooks/useBlockchain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Database, Link, Activity, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function BlockchainDashboard() {
  const {
    did,
    loading,
    chainStatus,
    verifyAuditTrail,
    mineBlock,
    exportBlockchainData,
    updateChainStatus
  } = useBlockchain();

  useEffect(() => {
    const interval = setInterval(() => {
      updateChainStatus();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [updateChainStatus]);

  const handleVerifyChain = async () => {
    try {
      const isValid = await verifyAuditTrail('*');
      toast({
        title: isValid ? "Blockchain Valid" : "Blockchain Invalid",
        description: isValid 
          ? "All blocks and transactions verified successfully"
          : "Blockchain integrity check failed",
        variant: isValid ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Failed to verify blockchain",
        variant: "destructive"
      });
    }
  };

  const handleMineBlock = async () => {
    try {
      await mineBlock();
    } catch (error) {
      toast({
        title: "Mining Failed",
        description: "Failed to mine new block",
        variant: "destructive"
      });
    }
  };

  const handleExportBlockchain = async () => {
    try {
      const data = await exportBlockchainData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blockchain-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Blockchain data exported successfully"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export blockchain data",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chain Height</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chainStatus?.height || 0}</div>
            <p className="text-xs text-muted-foreground">Total blocks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chainStatus?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">On-chain records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantum Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {chainStatus?.isQuantumResistant ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    Protected
                  </Badge>
                </>
              ) : (
                <Badge variant="destructive">Vulnerable</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Block</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {chainStatus?.lastBlockTime 
                ? new Date(chainStatus.lastBlockTime).toLocaleTimeString()
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Latest activity</p>
          </CardContent>
        </Card>
      </div>

      {/* DID Information */}
      {did && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Decentralized Identity (DID)
            </CardTitle>
            <CardDescription>
              Your quantum-resistant decentralized identifier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">DID</p>
                <p className="text-sm text-muted-foreground font-mono">{did.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Public Keys</p>
                <div className="space-y-1">
                  {did.publicKey.map((key, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {key.type}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(did.created).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Operations</CardTitle>
          <CardDescription>
            Manage and verify blockchain integrity
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={handleVerifyChain} variant="outline">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Verify Chain
          </Button>
          <Button onClick={handleMineBlock} variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Mine Block
          </Button>
          <Button onClick={handleExportBlockchain} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </CardContent>
      </Card>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Implementation Status</CardTitle>
          <CardDescription>Current capabilities and roadmap</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">✅ Quantum-Resistant Hashing</p>
                <p className="text-sm text-muted-foreground">BLAKE2b-256 for block hashing</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">Complete</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">✅ Immutable Audit Trail</p>
                <p className="text-sm text-muted-foreground">All actions logged to blockchain</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">Complete</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">✅ Decentralized Identity (DID)</p>
                <p className="text-sm text-muted-foreground">W3C-compliant quantum DIDs</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">Complete</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">🚧 Hyperledger Fabric Integration</p>
                <p className="text-sm text-muted-foreground">Enterprise blockchain network</p>
              </div>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">Phase 1</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">🚧 Smart Contracts</p>
                <p className="text-sm text-muted-foreground">Automated policy enforcement</p>
              </div>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">Phase 2</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">⏳ Zero-Knowledge Proofs</p>
                <p className="text-sm text-muted-foreground">Privacy-preserving verification</p>
              </div>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500">Phase 5</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
