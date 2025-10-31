/**
 * Performance Optimization Hook
 * Uses caching, memoization, and lazy loading for optimal performance
 */

import { useCallback, useEffect, useState } from 'react';
import {
  globalCryptoCache,
  globalBlockchainCache,
  globalMerkleTree,
  LazyAuditLoader,
  memoizeCrypto,
  processBatch
} from '@/lib/performance-cache';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function usePerformanceOptimization() {
  const [cacheStats, setCacheStats] = useState({
    crypto: { size: 0, hits: 0 },
    blockchain: { blocksCount: 0 },
    merkle: { size: 0 }
  });

  // Update cache statistics
  const updateStats = useCallback(() => {
    const cryptoStats = globalCryptoCache.getStats();
    const blockchainStats = globalBlockchainCache.getStats();

    setCacheStats({
      crypto: {
        size: cryptoStats.size,
        hits: cryptoStats.totalHits
      },
      blockchain: {
        blocksCount: blockchainStats.blocksCount
      },
      merkle: { size: 0 } // Merkle cache size tracking
    });
  }, []);

  // Periodic cache cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      // Evict expired entries
      const evicted = globalCryptoCache.evictExpired();
      if (evicted > 0) {
        console.log(`Evicted ${evicted} expired cache entries`);
      }
      updateStats();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [updateStats]);

  // Clear all caches
  const clearAllCaches = useCallback(() => {
    globalCryptoCache.clear();
    globalBlockchainCache.clear();
    globalMerkleTree.clearCache();
    updateStats();
    
    toast({
      title: "Caches Cleared",
      description: "All performance caches have been reset"
    });
  }, [updateStats]);

  // Memoized crypto operation example
  const memoizedHashOperation = useCallback(
    memoizeCrypto(
      async (data: string) => {
        const encoder = new TextEncoder();
        const buffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      },
      { maxSize: 1000, ttl: 1800000 }
    ),
    []
  );

  // Optimized Merkle root calculation
  const calculateOptimizedMerkleRoot = useCallback((hashes: string[]) => {
    return globalMerkleTree.calculateRoot(hashes);
  }, []);

  // Build Merkle proof
  const buildMerkleProof = useCallback((hashes: string[], index: number) => {
    return globalMerkleTree.buildProof(hashes, index);
  }, []);

  // Verify Merkle proof
  const verifyMerkleProof = useCallback(
    (transactionHash: string, proof: string[], root: string, index: number) => {
      return globalMerkleTree.verifyProof(transactionHash, proof, root, index);
    },
    []
  );

  return {
    cacheStats,
    updateStats,
    clearAllCaches,
    memoizedHashOperation,
    calculateOptimizedMerkleRoot,
    buildMerkleProof,
    verifyMerkleProof,
    // Export utilities for use in components
    LazyAuditLoader,
    processBatch
  };
}
