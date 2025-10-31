/**
 * Performance Optimization Utilities
 * Priority 4.1: Performance Optimization
 * 
 * Features:
 * - Memoization for expensive crypto operations
 * - Blockchain caching with LRU
 * - Optimized Merkle tree calculations
 * - Lazy loading utilities
 */

// ============================================================================
// Crypto Operation Cache
// ============================================================================

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

/**
 * LRU Cache for expensive cryptographic operations
 */
export class CryptoCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 1000, ttl: number = 3600000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Get cached value
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update hit count
    entry.hits++;
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }

  /**
   * Set cached value
   */
  set(key: string, value: T): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalHits = 0;
    let oldestEntry = Date.now();
    
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      if (entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      oldestAge: Date.now() - oldestEntry,
      utilizationPercent: (this.cache.size / this.maxSize) * 100
    };
  }

  /**
   * Evict expired entries
   */
  evictExpired(): number {
    const now = Date.now();
    let evicted = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        evicted++;
      }
    }
    
    return evicted;
  }
}

// ============================================================================
// Memoization Utilities
// ============================================================================

/**
 * Memoize expensive crypto operations
 */
export function memoizeCrypto<Args extends any[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: {
    maxSize?: number;
    ttl?: number;
    keyGenerator?: (...args: Args) => string;
  } = {}
): (...args: Args) => Promise<Result> {
  const cache = new CryptoCache<Result>(
    options.maxSize || 500,
    options.ttl || 1800000 // 30 minutes default
  );
  
  const keyGenerator = options.keyGenerator || ((...args: Args) => 
    JSON.stringify(args)
  );
  
  return async (...args: Args): Promise<Result> => {
    const key = keyGenerator(...args);
    
    // Check cache first
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function
    const result = await fn(...args);
    
    // Store in cache
    cache.set(key, result);
    
    return result;
  };
}

/**
 * Memoize sync crypto operations
 */
export function memoizeCryptoSync<Args extends any[], Result>(
  fn: (...args: Args) => Result,
  options: {
    maxSize?: number;
    ttl?: number;
    keyGenerator?: (...args: Args) => string;
  } = {}
): (...args: Args) => Result {
  const cache = new CryptoCache<Result>(
    options.maxSize || 500,
    options.ttl || 1800000
  );
  
  const keyGenerator = options.keyGenerator || ((...args: Args) => 
    JSON.stringify(args)
  );
  
  return (...args: Args): Result => {
    const key = keyGenerator(...args);
    
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  };
}

// ============================================================================
// Blockchain Caching
// ============================================================================

export interface BlockCache {
  index: number;
  hash: string;
  merkleRoot: string;
  timestamp: number;
  dataHash: string;
}

/**
 * Optimized blockchain cache with quick lookups
 */
export class BlockchainCache {
  private blocksByHash: Map<string, BlockCache>;
  private blocksByIndex: Map<number, BlockCache>;
  private merkleCache: CryptoCache<string>;
  private hashCache: CryptoCache<string>;
  
  constructor() {
    this.blocksByHash = new Map();
    this.blocksByIndex = new Map();
    this.merkleCache = new CryptoCache<string>(2000, 7200000); // 2 hours
    this.hashCache = new CryptoCache<string>(2000, 7200000);
  }

  /**
   * Cache block metadata for quick lookups
   */
  cacheBlock(block: BlockCache): void {
    this.blocksByHash.set(block.hash, block);
    this.blocksByIndex.set(block.index, block);
  }

  /**
   * Get block by hash (O(1) lookup)
   */
  getBlockByHash(hash: string): BlockCache | null {
    return this.blocksByHash.get(hash) || null;
  }

  /**
   * Get block by index (O(1) lookup)
   */
  getBlockByIndex(index: number): BlockCache | null {
    return this.blocksByIndex.get(index) || null;
  }

  /**
   * Cache Merkle root calculation
   */
  cacheMerkleRoot(dataHash: string, merkleRoot: string): void {
    this.merkleCache.set(dataHash, merkleRoot);
  }

  /**
   * Get cached Merkle root
   */
  getCachedMerkleRoot(dataHash: string): string | null {
    return this.merkleCache.get(dataHash);
  }

  /**
   * Cache block hash calculation
   */
  cacheBlockHash(blockData: string, hash: string): void {
    this.hashCache.set(blockData, hash);
  }

  /**
   * Get cached block hash
   */
  getCachedBlockHash(blockData: string): string | null {
    return this.hashCache.get(blockData);
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.blocksByHash.clear();
    this.blocksByIndex.clear();
    this.merkleCache.clear();
    this.hashCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      blocksCount: this.blocksByHash.size,
      merkleStats: this.merkleCache.getStats(),
      hashStats: this.hashCache.getStats()
    };
  }
}

// ============================================================================
// Optimized Merkle Tree
// ============================================================================

/**
 * Optimized Merkle tree with caching
 */
export class OptimizedMerkleTree {
  private cache: CryptoCache<string>;
  
  constructor() {
    this.cache = new CryptoCache<string>(5000, 3600000); // 1 hour cache
  }

  /**
   * Calculate Merkle root with caching
   */
  calculateRoot(hashes: string[]): string {
    if (hashes.length === 0) return '';
    if (hashes.length === 1) return hashes[0];
    
    // Create cache key from sorted hashes
    const cacheKey = hashes.join('|');
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached !== null) return cached;
    
    // Build tree efficiently
    let currentLevel = [...hashes];
    
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        
        // Use simple hash function for performance
        const combined = this.quickHash(left + right);
        nextLevel.push(combined);
      }
      
      currentLevel = nextLevel;
    }
    
    const root = currentLevel[0];
    
    // Cache result
    this.cache.set(cacheKey, root);
    
    return root;
  }

  /**
   * Quick hash function for Merkle tree (optimized for speed)
   */
  private quickHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  /**
   * Build Merkle proof for a specific transaction
   */
  buildProof(hashes: string[], index: number): string[] {
    const proof: string[] = [];
    let currentIndex = index;
    let currentLevel = [...hashes];
    
    while (currentLevel.length > 1) {
      const pairIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      
      if (pairIndex < currentLevel.length) {
        proof.push(currentLevel[pairIndex]);
      }
      
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        nextLevel.push(this.quickHash(left + right));
      }
      
      currentLevel = nextLevel;
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    return proof;
  }

  /**
   * Verify Merkle proof
   */
  verifyProof(
    transactionHash: string,
    proof: string[],
    root: string,
    index: number
  ): boolean {
    let computedHash = transactionHash;
    let currentIndex = index;
    
    for (const proofElement of proof) {
      if (currentIndex % 2 === 0) {
        computedHash = this.quickHash(computedHash + proofElement);
      } else {
        computedHash = this.quickHash(proofElement + computedHash);
      }
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    return computedHash === root;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// Lazy Loading Utilities
// ============================================================================

/**
 * Paginated data loader for large audit trails
 */
export class LazyAuditLoader<T> {
  private pageSize: number;
  private cache: Map<number, T[]>;
  private totalCount: number | null;
  
  constructor(pageSize: number = 50) {
    this.pageSize = pageSize;
    this.cache = new Map();
    this.totalCount = null;
  }

  /**
   * Load page with caching
   */
  async loadPage(
    pageNumber: number,
    fetchFn: (offset: number, limit: number) => Promise<T[]>
  ): Promise<T[]> {
    // Check cache
    if (this.cache.has(pageNumber)) {
      return this.cache.get(pageNumber)!;
    }
    
    // Fetch data
    const offset = pageNumber * this.pageSize;
    const data = await fetchFn(offset, this.pageSize);
    
    // Cache result
    this.cache.set(pageNumber, data);
    
    return data;
  }

  /**
   * Preload next pages in background
   */
  async preloadPages(
    currentPage: number,
    fetchFn: (offset: number, limit: number) => Promise<T[]>,
    lookahead: number = 2
  ): Promise<void> {
    const promises: Promise<T[]>[] = [];
    
    for (let i = 1; i <= lookahead; i++) {
      const nextPage = currentPage + i;
      if (!this.cache.has(nextPage)) {
        promises.push(this.loadPage(nextPage, fetchFn));
      }
    }
    
    // Load in background (don't await)
    Promise.all(promises).catch(console.error);
  }

  /**
   * Set total count for pagination
   */
  setTotalCount(count: number): void {
    this.totalCount = count;
  }

  /**
   * Get total pages
   */
  getTotalPages(): number {
    if (this.totalCount === null) return 0;
    return Math.ceil(this.totalCount / this.pageSize);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cachedPages: this.cache.size,
      pageSize: this.pageSize,
      totalCount: this.totalCount,
      totalPages: this.getTotalPages(),
      memorySizeEstimate: this.cache.size * this.pageSize
    };
  }
}

// ============================================================================
// Virtual Scrolling Helper
// ============================================================================

export interface VirtualScrollState {
  startIndex: number;
  endIndex: number;
  offsetY: number;
}

/**
 * Calculate virtual scroll window for large lists
 */
export function calculateVirtualWindow(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 5
): VirtualScrollState {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(totalItems, startIndex + visibleCount + overscan * 2);
  const offsetY = startIndex * itemHeight;
  
  return {
    startIndex,
    endIndex,
    offsetY
  };
}

// ============================================================================
// Batch Processing
// ============================================================================

/**
 * Process large datasets in batches to avoid blocking UI
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    delayBetweenBatches?: number;
    onProgress?: (processed: number, total: number) => void;
  } = {}
): Promise<R[]> {
  const {
    batchSize = 100,
    delayBetweenBatches = 10,
    onProgress
  } = options;
  
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }
    
    // Yield to UI thread
    if (i + batchSize < items.length && delayBetweenBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  return results;
}

// ============================================================================
// Export Performance Instances
// ============================================================================

// Global instances for reuse across application
export const globalCryptoCache = new CryptoCache(2000, 3600000);
export const globalBlockchainCache = new BlockchainCache();
export const globalMerkleTree = new OptimizedMerkleTree();
