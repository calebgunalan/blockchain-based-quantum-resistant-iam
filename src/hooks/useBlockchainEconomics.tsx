import { useState, useEffect } from 'react';
import { blockchainEconomics } from '@/lib/blockchain-economics';
import { toast } from 'sonner';

export const useBlockchainEconomics = (userId?: string) => {
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    if (!userId) return;
    try {
      const userBalance = await blockchainEconomics.getUserBalance(userId);
      setBalance(userBalance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const economicStats = await blockchainEconomics.getNetworkStats();
      setStats(economicStats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchStats();
  }, [userId]);

  const transferTokens = async (toUserId: string, amount: number) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      const success = await blockchainEconomics.transferTokens(
        userId,
        toUserId,
        amount
      );
      if (success) {
        toast.success('Transfer successful');
        await fetchBalance();
        return true;
      } else {
        toast.error('Transfer failed');
        return false;
      }
    } catch (error) {
      toast.error('Error processing transfer');
      return false;
    }
  };

  return {
    balance,
    stats,
    loading,
    transferTokens,
    refresh: async () => {
      await fetchBalance();
      await fetchStats();
    }
  };
};
