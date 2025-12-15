import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlockchainDashboard } from "@/components/admin/BlockchainDashboard";
import { BlockchainPolicyManager } from "@/components/admin/BlockchainPolicyManager";
import { SystemMonitoringDashboard } from "@/components/admin/SystemMonitoringDashboard";
import { BlockchainPruningManager } from "@/components/admin/BlockchainPruningManager";
import { P2PNetworkStatus } from "@/components/admin/P2PNetworkStatus";
import { BlockchainStorageStats } from "@/components/admin/BlockchainStorageStats";
import Layout from "@/components/Layout";
import { Shield, Network } from "lucide-react";
import { useP2PBlockchain } from "@/hooks/useP2PBlockchain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { BlockchainInfoDialog, QuantumSecurityInfoDialog } from "@/components/security/InfoDialogs";

export default function BlockchainManagement() {
  const [enableP2P, setEnableP2P] = useState(false);
  const { 
    blockchain, 
    loading, 
    syncing, 
    networkStats, 
    storageStats,
    mineBlock,
    synchronize,
    validateChain,
    updateStats
  } = useP2PBlockchain(enableP2P);

  const handleMineBlock = async () => {
    await mineBlock();
    updateStats();
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Blockchain Management</h1>
              <BlockchainInfoDialog />
              <QuantumSecurityInfoDialog />
            </div>
            
            <div className="flex items-center gap-3">
              <Label htmlFor="p2p-mode">
                <Network className="h-4 w-4 inline mr-2" />
                P2P Mode
              </Label>
              <Switch 
                id="p2p-mode"
                checked={enableP2P} 
                onCheckedChange={setEnableP2P}
                disabled={loading}
              />
            </div>
          </div>
          <p className="text-muted-foreground">
            Quantum-resistant blockchain with P2P synchronization and persistent storage
          </p>
        </div>

        <Tabs defaultValue="p2p" className="space-y-6">
          <TabsList>
            <TabsTrigger value="p2p">P2P Network</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="policies">Smart Policies</TabsTrigger>
            <TabsTrigger value="pruning">Pruning</TabsTrigger>
          </TabsList>

          <TabsContent value="p2p" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <P2PNetworkStatus 
                networkStats={networkStats}
                onSync={synchronize}
                syncing={syncing}
              />
              <BlockchainStorageStats stats={storageStats} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Blockchain Controls</CardTitle>
                <CardDescription>
                  Manage your quantum-resistant blockchain
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button 
                    onClick={handleMineBlock}
                    disabled={loading || !blockchain}
                  >
                    Mine New Block
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      const isValid = await validateChain();
                      alert(isValid ? 'Chain is valid ✓' : 'Chain validation failed ✗');
                    }}
                    disabled={loading || !blockchain}
                  >
                    Validate Chain
                  </Button>
                </div>

                {loading && (
                  <p className="text-sm text-muted-foreground">
                    Initializing blockchain...
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring">
            <SystemMonitoringDashboard />
          </TabsContent>

          <TabsContent value="dashboard">
            <BlockchainDashboard />
          </TabsContent>

          <TabsContent value="policies">
            <BlockchainPolicyManager />
          </TabsContent>

          <TabsContent value="pruning">
            <BlockchainPruningManager />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
