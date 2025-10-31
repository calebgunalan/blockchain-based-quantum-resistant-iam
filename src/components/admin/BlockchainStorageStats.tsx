import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Database, HardDrive, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BlockchainStorageStatsProps {
  stats: {
    totalBlocks: number;
    latestBlockIndex: number;
    latestBlockHash: string;
    latestBlockTimestamp: number;
  } | null;
}

export function BlockchainStorageStats({ stats }: BlockchainStorageStatsProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading storage stats...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          IndexedDB Storage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Blocks Stored</span>
            <span className="font-mono font-bold">{stats.totalBlocks}</span>
          </div>
          <Progress value={(stats.totalBlocks / 1000) * 100} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              Latest Block
            </div>
            <p className="font-mono">#{stats.latestBlockIndex}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last Updated
            </div>
            <p className="text-xs">
              {stats.latestBlockTimestamp 
                ? formatDistanceToNow(new Date(stats.latestBlockTimestamp), { addSuffix: true })
                : 'Never'
              }
            </p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">Latest Block Hash</p>
          <p className="font-mono text-xs break-all bg-muted p-2 rounded">
            {stats.latestBlockHash || 'N/A'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
