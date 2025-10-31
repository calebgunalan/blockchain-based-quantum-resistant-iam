/**
 * Blockchain Storage using IndexedDB
 * Persistent local storage for blockchain data
 */

import { QuantumBlock } from './quantum-blockchain';

const DB_NAME = 'quantum-blockchain-db';
const DB_VERSION = 1;
const BLOCKS_STORE = 'blocks';
const METADATA_STORE = 'metadata';

export class BlockchainStorage {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create blocks store
        if (!db.objectStoreNames.contains(BLOCKS_STORE)) {
          const blocksStore = db.createObjectStore(BLOCKS_STORE, { keyPath: 'hash' });
          blocksStore.createIndex('index', 'index', { unique: true });
          blocksStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
        }

        console.log('IndexedDB schema created');
      };
    });
  }

  /**
   * Save a block to IndexedDB
   */
  async saveBlock(block: QuantumBlock): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOCKS_STORE], 'readwrite');
      const store = transaction.objectStore(BLOCKS_STORE);
      const request = store.put(block);

      request.onsuccess = () => {
        console.log(`Block ${block.index} saved to IndexedDB`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a block by hash
   */
  async getBlock(hash: string): Promise<QuantumBlock | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOCKS_STORE], 'readonly');
      const store = transaction.objectStore(BLOCKS_STORE);
      const request = store.get(hash);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a block by index
   */
  async getBlockByIndex(index: number): Promise<QuantumBlock | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOCKS_STORE], 'readonly');
      const store = transaction.objectStore(BLOCKS_STORE);
      const indexStore = store.index('index');
      const request = indexStore.get(index);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all blocks
   */
  async getAllBlocks(): Promise<QuantumBlock[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOCKS_STORE], 'readonly');
      const store = transaction.objectStore(BLOCKS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const blocks = request.result;
        // Sort by index
        blocks.sort((a, b) => a.index - b.index);
        resolve(blocks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get blocks in range
   */
  async getBlocksInRange(startIndex: number, endIndex: number): Promise<QuantumBlock[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOCKS_STORE], 'readonly');
      const store = transaction.objectStore(BLOCKS_STORE);
      const indexStore = store.index('index');
      const range = IDBKeyRange.bound(startIndex, endIndex);
      const request = indexStore.getAll(range);

      request.onsuccess = () => {
        const blocks = request.result;
        blocks.sort((a, b) => a.index - b.index);
        resolve(blocks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get latest block
   */
  async getLatestBlock(): Promise<QuantumBlock | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOCKS_STORE], 'readonly');
      const store = transaction.objectStore(BLOCKS_STORE);
      const indexStore = store.index('index');
      const request = indexStore.openCursor(null, 'prev');

      request.onsuccess = () => {
        const cursor = request.result;
        resolve(cursor ? cursor.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get blockchain height (number of blocks)
   */
  async getHeight(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOCKS_STORE], 'readonly');
      const store = transaction.objectStore(BLOCKS_STORE);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete blocks after a certain index (for chain reorganization)
   */
  async deleteBlocksAfter(index: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const blocks = await this.getAllBlocks();
    const toDelete = blocks.filter(b => b.index > index);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOCKS_STORE], 'readwrite');
      const store = transaction.objectStore(BLOCKS_STORE);

      let deleted = 0;
      toDelete.forEach(block => {
        const request = store.delete(block.hash);
        request.onsuccess = () => {
          deleted++;
          if (deleted === toDelete.length) {
            console.log(`Deleted ${deleted} blocks after index ${index}`);
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      if (toDelete.length === 0) resolve();
    });
  }

  /**
   * Save metadata
   */
  async saveMetadata(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get metadata
   */
  async getMetadata(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all blockchain data
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOCKS_STORE, METADATA_STORE], 'readwrite');
      
      const blocksStore = transaction.objectStore(BLOCKS_STORE);
      const metadataStore = transaction.objectStore(METADATA_STORE);

      const clearBlocks = blocksStore.clear();
      const clearMetadata = metadataStore.clear();

      let cleared = 0;
      const checkComplete = () => {
        cleared++;
        if (cleared === 2) {
          console.log('All blockchain data cleared');
          resolve();
        }
      };

      clearBlocks.onsuccess = checkComplete;
      clearMetadata.onsuccess = checkComplete;
      
      clearBlocks.onerror = () => reject(clearBlocks.error);
      clearMetadata.onerror = () => reject(clearMetadata.error);
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('IndexedDB connection closed');
    }
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    const height = await this.getHeight();
    const latestBlock = await this.getLatestBlock();

    return {
      totalBlocks: height,
      latestBlockIndex: latestBlock?.index || 0,
      latestBlockHash: latestBlock?.hash || '',
      latestBlockTimestamp: latestBlock?.timestamp || 0
    };
  }
}
