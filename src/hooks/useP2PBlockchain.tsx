import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { P2PQuantumBlockchain } from '@/lib/p2p-quantum-blockchain';
import { toast } from '@/hooks/use-toast';

export function useP2PBlockchain(enableP2P: boolean = false) {
  const { user } = useAuth();
  const [blockchain, setBlockchain] = useState<P2PQuantumBlockchain | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [storageStats, setStorageStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      initializeBlockchain();
    }
    
    return () => {
      if (blockchain) {
        blockchain.disconnect();
      }
    };
  }, [user, enableP2P]);

  const initializeBlockchain = async () => {
    try {
      setLoading(true);
      
      const chain = new P2PQuantumBlockchain({
        userId: user?.id || 'anonymous',
        difficulty: 2,
        enableP2P
      });
      
      await chain.initialize();
      setBlockchain(chain);
      
      // Update stats
      updateStats(chain);
      
      toast({
        title: "Blockchain Initialized",
        description: enableP2P 
          ? "P2P blockchain network ready" 
          : "Local blockchain ready",
      });
    } catch (error) {
      console.error('Failed to initialize blockchain:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize blockchain",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStats = async (chain: P2PQuantumBlockchain) => {
    if (enableP2P) {
      setNetworkStats(chain.getNetworkStats());
    }
    
    const data = await chain.exportData();
    setStorageStats({
      totalBlocks: data.totalBlocks,
      latestBlockIndex: data.latestBlockIndex,
      latestBlockHash: data.latestBlockHash,
      latestBlockTimestamp: data.latestBlockTimestamp
    });
  };

  const mineBlock = async () => {
    if (!blockchain) return null;
    
    try {
      const block = await blockchain.minePendingTransactions(user?.id || 'system');
      await updateStats(blockchain);
      
      toast({
        title: "Block Mined",
        description: `Block #${block.index} created successfully`,
      });
      
      return block;
    } catch (error) {
      console.error('Mining error:', error);
      toast({
        title: "Mining Error",
        description: "Failed to mine block",
        variant: "destructive"
      });
      return null;
    }
  };

  const synchronize = async () => {
    if (!blockchain || !enableP2P) return;
    
    try {
      setSyncing(true);
      await blockchain.synchronize();
      await updateStats(blockchain);
      
      toast({
        title: "Sync Complete",
        description: "Blockchain synchronized with network",
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Error",
        description: "Failed to synchronize",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const addTransaction = (transaction: any) => {
    if (!blockchain) return;
    blockchain.addTransaction(transaction);
  };

  const validateChain = async (): Promise<boolean> => {
    if (!blockchain) return false;
    return await blockchain.isValidChain();
  };

  const exportData = async () => {
    if (!blockchain) return null;
    return await blockchain.exportData();
  };

  return {
    blockchain,
    loading,
    syncing,
    networkStats,
    storageStats,
    mineBlock,
    synchronize,
    addTransaction,
    validateChain,
    exportData,
    updateStats: () => blockchain && updateStats(blockchain)
  };
}
