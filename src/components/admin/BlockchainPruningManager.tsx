import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Archive, 
  Trash2, 
  Download, 
  Database, 
  AlertCircle,
  CheckCircle2,
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  archiveBlocks,
  pruneArchivedBlocks,
  autoprune,
  restoreFromArchive,
  getArchiveStats,
  listArchives,
  DEFAULT_PRUNING_POLICY,
  type PruningPolicy,
  type ArchiveMetadata,
} from '@/lib/blockchain-pruning';

export function BlockchainPruningManager() {
  const [policy, setPolicy] = useState<PruningPolicy>(DEFAULT_PRUNING_POLICY);
  const [archives, setArchives] = useState<ArchiveMetadata[]>([]);
  const [stats, setStats] = useState({
    totalArchives: 0,
    totalArchivedBlocks: 0,
    oldestArchive: null as Date | null,
    newestArchive: null as Date | null,
  });
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Manual archive inputs
  const [startHeight, setStartHeight] = useState('');
  const [endHeight, setEndHeight] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [archiveList, archiveStats] = await Promise.all([
        listArchives(),
        getArchiveStats(),
      ]);
      setArchives(archiveList);
      setStats(archiveStats);
    } catch (error) {
      console.error('Failed to load pruning data:', error);
    }
  };

  const handleManualArchive = async () => {
    const start = parseInt(startHeight);
    const end = parseInt(endHeight);

    if (isNaN(start) || isNaN(end) || start > end) {
      toast.error('Invalid block height range');
      return;
    }

    setArchiving(true);
    try {
      const result = await archiveBlocks(start, end);
      toast.success(`Archived ${result.blockCount} blocks successfully`);
      await loadData();
      setStartHeight('');
      setEndHeight('');
    } catch (error) {
      console.error('Archive failed:', error);
      toast.error('Failed to archive blocks');
    } finally {
      setArchiving(false);
    }
  };

  const handleAutoprune = async () => {
    setLoading(true);
    try {
      const result = await autoprune(policy);
      toast.success(
        `Auto-pruning complete: ${result.archived} blocks archived, ${result.pruned} blocks pruned`
      );
      await loadData();
    } catch (error) {
      console.error('Auto-pruning failed:', error);
      toast.error('Auto-pruning failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (archiveId: string) => {
    setLoading(true);
    try {
      const count = await restoreFromArchive(archiveId);
      toast.success(`Restored ${count} blocks from archive`);
      await loadData();
    } catch (error) {
      console.error('Restore failed:', error);
      toast.error('Failed to restore from archive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Blockchain Pruning & Archival</h2>
        <p className="text-muted-foreground">
          Manage blockchain storage with automatic archival and pruning
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Archives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArchives}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Archived Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArchivedBlocks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Oldest Archive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {stats.oldestArchive?.toLocaleDateString() || 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Newest Archive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {stats.newestArchive?.toLocaleDateString() || 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pruning Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Pruning Policy
          </CardTitle>
          <CardDescription>
            Configure automatic blockchain pruning and archival
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="retentionDays">Retention Period (Days)</Label>
              <Input
                id="retentionDays"
                type="number"
                value={policy.retentionDays}
                onChange={(e) => setPolicy({ ...policy, retentionDays: parseInt(e.target.value) })}
                min={30}
                max={365}
              />
              <p className="text-xs text-muted-foreground">
                Blocks older than this will be eligible for archival
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pruneInterval">Prune Interval (Hours)</Label>
              <Input
                id="pruneInterval"
                type="number"
                value={policy.pruneInterval}
                onChange={(e) => setPolicy({ ...policy, pruneInterval: parseInt(e.target.value) })}
                min={1}
                max={168}
              />
              <p className="text-xs text-muted-foreground">
                How often to check for blocks to archive
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Archival</Label>
              <p className="text-xs text-muted-foreground">
                Store old blocks in compressed archives
              </p>
            </div>
            <Switch
              checked={policy.archiveEnabled}
              onCheckedChange={(checked) => setPolicy({ ...policy, archiveEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Prune After Archive</Label>
              <p className="text-xs text-muted-foreground">
                Automatically remove archived blocks from active chain
              </p>
            </div>
            <Switch
              checked={policy.autoArchive}
              onCheckedChange={(checked) => setPolicy({ ...policy, autoArchive: checked })}
              disabled={!policy.archiveEnabled}
            />
          </div>

          <Button onClick={handleAutoprune} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Auto-Prune...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Run Auto-Prune Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Manual Archive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Manual Archive
          </CardTitle>
          <CardDescription>
            Archive specific block range manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Archived blocks are stored securely and can be restored at any time. 
              Use auto-pruning to automatically remove archived blocks from the active chain.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startHeight">Start Block Height</Label>
              <Input
                id="startHeight"
                type="number"
                placeholder="0"
                value={startHeight}
                onChange={(e) => setStartHeight(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endHeight">End Block Height</Label>
              <Input
                id="endHeight"
                type="number"
                placeholder="100"
                value={endHeight}
                onChange={(e) => setEndHeight(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleManualArchive} disabled={archiving} className="w-full">
            {archiving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archiving...
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Create Archive
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Archive List */}
      <Card>
        <CardHeader>
          <CardTitle>Archive History</CardTitle>
          <CardDescription>
            View and manage blockchain archives
          </CardDescription>
        </CardHeader>
        <CardContent>
          {archives.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No archives created yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archive ID</TableHead>
                  <TableHead>Block Range</TableHead>
                  <TableHead>Block Count</TableHead>
                  <TableHead>Archived At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archives.map((archive) => (
                  <TableRow key={archive.archiveId}>
                    <TableCell className="font-mono text-xs">
                      {archive.archiveId.substring(0, 20)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {archive.startHeight} - {archive.endHeight}
                      </Badge>
                    </TableCell>
                    <TableCell>{archive.blockCount}</TableCell>
                    <TableCell>{archive.archivedAt.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(archive.archiveId)}
                        disabled={loading}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
