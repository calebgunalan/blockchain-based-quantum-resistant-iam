import { useState, useCallback } from 'react';
import { TransactionPool, Transaction } from '@/lib/transaction-pool';
import { toast } from '@/hooks/use-toast';

export function useTransactionPool() {
  const [pool] = useState(() => new TransactionPool());
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const addTransaction = useCallback(async (transaction: Transaction) => {
    try {
      setLoading(true);
      const success = await pool.addTransaction(transaction);
      
      if (success) {
        toast({
          title: "Transaction Added",
          description: "Transaction added to mempool"
        });
        await refreshStats();
        return true;
      } else {
        toast({
          title: "Invalid Transaction",
          description: "Transaction validation failed",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [pool]);

  const getPendingTransactions = useCallback(async (limit = 100) => {
    try {
      return await pool.getPendingTransactions(limit);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }, [pool]);

  const refreshStats = useCallback(async () => {
    try {
      const poolStats = await pool.getPoolStats();
      setStats(poolStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [pool]);

  const cleanOldTransactions = useCallback(async (maxAgeHours = 24) => {
    try {
      await pool.cleanOldTransactions(maxAgeHours);
      toast({
        title: "Cleanup Complete",
        description: "Old transactions removed from mempool"
      });
      await refreshStats();
    } catch (error) {
      console.error('Error cleaning transactions:', error);
    }
  }, [pool, refreshStats]);

  return {
    addTransaction,
    getPendingTransactions,
    refreshStats,
    cleanOldTransactions,
    loading,
    stats
  };
}
