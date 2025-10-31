/**
 * P2P Quantum Blockchain Integration
 * Combines quantum resistance with P2P network synchronization
 */

import { EnhancedQuantumBlockchain, QuantumBlock } from './enhanced-quantum-blockchain';
import { P2PNetworkManager, NetworkMessage } from './p2p-network-manager';
import { BlockchainStorage } from './blockchain-storage';
import { DistributedConsensus } from './distributed-consensus';

export interface P2PBlockchainConfig {
  userId: string;
  difficulty?: number;
  enableP2P?: boolean;
}

export class P2PQuantumBlockchain extends EnhancedQuantumBlockchain {
  private network: P2PNetworkManager;
  private storage: BlockchainStorage;
  private consensus: DistributedConsensus;
  private userId: string;
  private enableP2P: boolean;
  private syncInProgress: boolean = false;

  constructor(config: P2PBlockchainConfig) {
    super(config.difficulty || 2);
    this.userId = config.userId;
    this.enableP2P = config.enableP2P ?? true;
    this.network = new P2PNetworkManager(config.userId);
    this.storage = new BlockchainStorage();
    this.consensus = new DistributedConsensus(this.network);
  }

  /**
   * Initialize P2P blockchain with storage and network
   */
  async initialize() {
    // Initialize storage
    await this.storage.initialize();
    
    // Load chain from IndexedDB
    const storedBlocks = await this.storage.getAllBlocks();
    if (storedBlocks.length > 0) {
      this.chain = storedBlocks as any[];
      console.log(`Loaded ${storedBlocks.length} blocks from IndexedDB`);
    }

    // Initialize signing keys
    await this.initializeKeys();

    // Initialize P2P network if enabled
    if (this.enableP2P) {
      await this.network.initialize(this.handleNetworkMessage.bind(this));
      console.log('P2P network initialized');
    }

    return this;
  }

  /**
   * Handle incoming network messages
   */
  private async handleNetworkMessage(message: NetworkMessage, peerId: string) {
    console.log(`Received ${message.type} from ${peerId}`);

    switch (message.type) {
      case 'block':
        await this.handleIncomingBlock(message.data, peerId);
        break;
      case 'sync_request':
        await this.handleSyncRequest(message.data, peerId);
        break;
      case 'sync_response':
        await this.handleSyncResponse(message.data);
        break;
      case 'transaction':
        this.handleIncomingTransaction(message.data);
        break;
    }
  }

  /**
   * Handle incoming block from peer
   */
  private async handleIncomingBlock(block: QuantumBlock, peerId: string) {
    if (this.syncInProgress) return;

    // Check if block is already known
    const known = await this.consensus.isBlockKnown(block.hash, this.chain as any[]);
    if (known) return;

    // Validate block
    const previousBlock = this.chain[block.index - 1] as any;
    const validation = this.consensus.validateBlock(block as any, previousBlock);

    if (validation.accepted) {
      // Add to chain
      this.chain.push(block as any);
      
      // Persist to storage
      await this.storage.saveBlock(block as any);
      
      console.log(`Accepted block ${block.index} from ${peerId}`);
    } else {
      console.warn(`Rejected block ${block.index}: ${validation.reason}`);
    }
  }

  /**
   * Handle sync request from peer
   */
  private async handleSyncRequest(data: { fromIndex: number }, peerId: string) {
    const blocks = this.chain.slice(data.fromIndex);
    
    await this.network.sendToPeer(peerId, {
      type: 'sync_response',
      data: { blocks }
    });
  }

  /**
   * Handle sync response
   */
  private async handleSyncResponse(data: { blocks: QuantumBlock[] }) {
    if (data.blocks.length === 0) return;

    this.syncInProgress = true;

    try {
      const peerChain = data.blocks as any[];
      const localChain = this.chain as any[];

      const resolution = await this.consensus.resolveConflicts(localChain, peerChain);

      if (resolution.shouldReplace) {
        // Replace chain
        this.chain = resolution.winningChain as any[];
        
        // Delete old blocks and save new ones
        await this.storage.deleteBlocksAfter(localChain.length - 1);
        for (const block of peerChain) {
          await this.storage.saveBlock(block);
        }
        
        console.log(`Chain replaced: ${resolution.reason}`);
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Handle incoming transaction
   */
  private handleIncomingTransaction(transaction: any) {
    this.addTransaction(transaction);
  }

  /**
   * Mine block with P2P broadcast
   */
  async minePendingTransactions(minerAddress: string): Promise<QuantumBlock> {
    const block = await super.minePendingTransactions(minerAddress);
    
    // Save to IndexedDB
    await this.storage.saveBlock(block as any);
    
    // Broadcast to network if enabled
    if (this.enableP2P) {
      await this.consensus.broadcastBlock(block as any);
    }
    
    return block;
  }

  /**
   * Synchronize with network
   */
  async synchronize() {
    const currentHeight = this.chain.length;
    await this.consensus.synchronizeChain(currentHeight);
  }

  /**
   * Get P2P network statistics
   */
  getNetworkStats() {
    return {
      ...this.network.getNetworkStats(),
      consensusParams: this.consensus.getConsensusParams()
    };
  }

  /**
   * Disconnect from P2P network
   */
  async disconnect() {
    await this.network.disconnect();
    this.storage.close();
  }

  /**
   * Export blockchain data
   */
  async exportData() {
    const stats = await this.storage.getStats();
    const networkStats = this.getNetworkStats();
    
    return {
      ...stats,
      networkStats,
      isValid: await this.isValidChain(),
      blocks: this.chain
    };
  }
}
