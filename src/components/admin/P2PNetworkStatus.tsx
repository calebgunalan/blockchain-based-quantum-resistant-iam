import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, Users, Activity, RefreshCw } from "lucide-react";

interface P2PNetworkStatusProps {
  networkStats: {
    totalPeers: number;
    connectedPeers: number;
    localPeerId: string;
    consensusParams: {
      difficulty: number;
      minConfirmations: number;
      algorithm: string;
    };
  } | null;
  onSync: () => void;
  syncing: boolean;
}

export function P2PNetworkStatus({ networkStats, onSync, syncing }: P2PNetworkStatusProps) {
  if (!networkStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            P2P Network (Disabled)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            P2P network is not enabled for this blockchain
          </p>
        </CardContent>
      </Card>
    );
  }

  const isConnected = networkStats.connectedPeers > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          P2P Network Status
        </CardTitle>
        <Button 
          onClick={onSync} 
          disabled={syncing || !isConnected}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          Sync
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Connection Status</p>
            <Badge variant={isConnected ? "default" : "secondary"}>
              <Activity className="h-3 w-3 mr-1" />
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Connected Peers</p>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-lg">
                {networkStats.connectedPeers} / {networkStats.totalPeers}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Consensus Parameters</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Algorithm</p>
              <p className="font-mono">{networkStats.consensusParams.algorithm}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Difficulty</p>
              <p className="font-mono">{networkStats.consensusParams.difficulty}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Confirmations</p>
              <p className="font-mono">{networkStats.consensusParams.minConfirmations}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1 pt-2 border-t">
          <p className="text-xs text-muted-foreground">Peer ID</p>
          <p className="font-mono text-xs break-all">{networkStats.localPeerId}</p>
        </div>
      </CardContent>
    </Card>
  );
}
