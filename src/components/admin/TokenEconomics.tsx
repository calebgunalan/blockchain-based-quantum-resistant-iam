import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BlockchainEconomics } from '@/lib/blockchain-economics';
import { Coins, TrendingUp, Users, DollarSign } from 'lucide-react';

export function TokenEconomics() {
  const [economics] = useState(() => new BlockchainEconomics());
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const networkStats = await economics.getNetworkStats();
      setStats(networkStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supply</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSupply?.toFixed(4) || '0.0000'}</div>
            <p className="text-xs text-muted-foreground">Tokens in circulation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEarned?.toFixed(4) || '0.0000'}</div>
            <p className="text-xs text-muted-foreground">Mining rewards distributed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSpent?.toFixed(4) || '0.0000'}</div>
            <p className="text-xs text-muted-foreground">Transaction fees paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAccounts || 0}</div>
            <p className="text-xs text-muted-foreground">With positive balance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Economic Model</CardTitle>
          <CardDescription>Blockchain tokenomics and reward structure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Base Block Reward</p>
              <p className="text-2xl font-bold">50 Tokens</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Halving Interval</p>
              <p className="text-2xl font-bold">210,000 Blocks</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Min Transaction Fee</p>
              <p className="text-2xl font-bold">0.0001 Tokens</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Fee per Byte</p>
              <p className="text-2xl font-bold">0.00000001</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
