import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCrossChainIdentity } from '@/hooks/useCrossChainIdentity';
import { BlockchainNetwork } from '@/lib/cross-chain-identity';
import { 
  Network, 
  Link2, 
  RefreshCw, 
  ArrowRightLeft, 
  Check,
  Clock,
  Globe,
  Shield
} from 'lucide-react';

export function CrossChainIdentityManager() {
  const {
    crossChainIdentity,
    linkedNetworks,
    pendingMessages,
    loading,
    syncing,
    linkToNetwork,
    syncAcrossNetworks,
    transferPermission,
    getStatistics
  } = useCrossChainIdentity();

  const [selectedNetwork, setSelectedNetwork] = useState<BlockchainNetwork>('ethereum');
  const [networkAddress, setNetworkAddress] = useState('');
  const [networkPublicKey, setNetworkPublicKey] = useState('');
  const [linking, setLinking] = useState(false);

  const stats = getStatistics();

  const handleLinkNetwork = async () => {
    if (!networkAddress || !networkPublicKey) return;

    try {
      setLinking(true);
      await linkToNetwork(selectedNetwork, networkAddress, networkPublicKey);
      setNetworkAddress('');
      setNetworkPublicKey('');
    } finally {
      setLinking(false);
    }
  };

  const availableNetworks: { value: BlockchainNetwork; label: string }[] = [
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'avalanche', label: 'Avalanche' },
    { value: 'binance', label: 'Binance Smart Chain' },
    { value: 'fabric', label: 'Hyperledger Fabric' }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Networks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.totalNetworks}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bridge Proofs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.totalBridgeProofs}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.pendingMessages}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={crossChainIdentity ? "default" : "secondary"}>
              {crossChainIdentity ? "Active" : "Inactive"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cross-Chain Identity</CardTitle>
              <CardDescription>
                Manage your universal identity across multiple blockchain networks
              </CardDescription>
            </div>
            <Button
              onClick={syncAcrossNetworks}
              disabled={syncing || linkedNetworks.length === 0}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync Networks
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="networks">
            <TabsList>
              <TabsTrigger value="networks">Linked Networks</TabsTrigger>
              <TabsTrigger value="link">Link New Network</TabsTrigger>
              <TabsTrigger value="messages">
                Messages
                {pendingMessages.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingMessages.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="networks" className="space-y-4">
              {linkedNetworks.length === 0 ? (
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    No networks linked yet. Link your identity to other blockchain networks to enable cross-chain features.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {linkedNetworks.map((network) => (
                    <Card key={network.network}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Network className="h-4 w-4 text-primary" />
                              <span className="font-semibold capitalize">{network.network}</span>
                              {network.isVerified && (
                                <Badge variant="default" className="text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">DID:</span> {network.did}
                              </div>
                              <div>
                                <span className="font-medium">Address:</span> {network.address}
                              </div>
                              <div>
                                <span className="font-medium">Added:</span>{' '}
                                {new Date(network.addedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="link" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Blockchain Network</Label>
                  <Select
                    value={selectedNetwork}
                    onValueChange={(value) => setSelectedNetwork(value as BlockchainNetwork)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableNetworks.map((network) => (
                        <SelectItem key={network.value} value={network.value}>
                          {network.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Network Address</Label>
                  <Input
                    placeholder="0x..."
                    value={networkAddress}
                    onChange={(e) => setNetworkAddress(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your address on the target blockchain network
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Network Public Key</Label>
                  <Input
                    placeholder="Public key for the target network"
                    value={networkPublicKey}
                    onChange={(e) => setNetworkPublicKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your public key on the target network (optional but recommended)
                  </p>
                </div>

                <Button
                  onClick={handleLinkNetwork}
                  disabled={linking || !networkAddress}
                  className="w-full"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  {linking ? 'Linking...' : 'Link Network'}
                </Button>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Linking creates a quantum-resistant cryptographic proof that verifies your identity across networks without revealing sensitive information.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              {pendingMessages.length === 0 ? (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    No pending cross-chain messages
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {pendingMessages.map((message) => (
                    <Card key={message.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{message.messageType}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="capitalize">{message.sourceNetwork}</span>
                            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{message.targetNetwork}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Primary Identity Info */}
      {crossChainIdentity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Primary Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">DID:</span>{' '}
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {crossChainIdentity.primaryDID}
              </code>
            </div>
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(crossChainIdentity.createdAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Last Synced:</span>{' '}
              {new Date(crossChainIdentity.lastSyncedAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
