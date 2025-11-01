import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTransactionPool } from '@/hooks/useTransactionPool';
import { RefreshCw, Trash2 } from 'lucide-react';

export function MempoolViewer() {
  const { getPendingTransactions, refreshStats, cleanOldTransactions, loading, stats } = useTransactionPool();
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadTransactions();
    refreshStats();
  }, []);

  const loadTransactions = async () => {
    const txs = await getPendingTransactions(50);
    setTransactions(txs);
  };

  const handleRefresh = async () => {
    await loadTransactions();
    await refreshStats();
  };

  const handleCleanup = async () => {
    await cleanOldTransactions(24);
    await loadTransactions();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl">{stats?.pending_count || 0}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Fees</CardDescription>
            <CardTitle className="text-3xl">{stats?.total_fees?.toFixed(4) || '0.0000'}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Fee</CardDescription>
            <CardTitle className="text-3xl">{stats?.avg_fee?.toFixed(6) || '0.000000'}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Size</CardDescription>
            <CardTitle className="text-3xl">{((stats?.total_size_bytes || 0) / 1024).toFixed(2)} KB</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Transaction Mempool</CardTitle>
              <CardDescription>Pending transactions waiting for confirmation</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleCleanup} variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clean Old
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Fee/Byte</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No pending transactions
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-sm">
                      {tx.id.substring(0, 16)}...
                    </TableCell>
                    <TableCell>{tx.fee.toFixed(6)}</TableCell>
                    <TableCell>{tx.sizeBytes} bytes</TableCell>
                    <TableCell>{(tx.fee / tx.sizeBytes).toFixed(8)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
