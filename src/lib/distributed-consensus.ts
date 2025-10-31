/**
 * Distributed Consensus Engine
 * Simple Proof-of-Work consensus for P2P blockchain
 */

import { QuantumBlock } from './quantum-blockchain';
import { P2PNetworkManager } from './p2p-network-manager';

export interface ConsensusResult {
  accepted: boolean;
  reason: string;
  conflictingBlock?: QuantumBlock;
}

export class DistributedConsensus {
  private difficulty: number = 4; // Number of leading zeros required
  private readonly MIN_CONFIRMATIONS = 1; // In real network, would be higher

  constructor(private network: P2PNetworkManager) {}

  /**
   * Validate a block according to consensus rules
   */
  validateBlock(block: QuantumBlock, previousBlock: QuantumBlock | null): ConsensusResult {
    // 1. Check block index
    if (previousBlock && block.index !== previousBlock.index + 1) {
      return {
        accepted: false,
        reason: `Invalid block index: expected ${previousBlock.index + 1}, got ${block.index}`
      };
    }

    // 2. Check previous hash
    if (previousBlock && block.previousHash !== previousBlock.hash) {
      return {
        accepted: false,
        reason: 'Invalid previous hash'
      };
    }

    // 3. Verify proof of work
    if (!this.verifyProofOfWork(block)) {
      return {
        accepted: false,
        reason: 'Invalid proof of work'
      };
    }

    // 4. Check timestamp (not too far in the future)
    const blockTime = new Date(block.timestamp).getTime();
    const now = Date.now();
    if (blockTime > now + 2 * 60 * 60 * 1000) { // 2 hours in future
      return {
        accepted: false,
        reason: 'Block timestamp too far in future'
      };
    }

    // 5. Verify merkle root
    // (In production, would compute merkle root and verify)

    return {
      accepted: true,
      reason: 'Block validated successfully'
    };
  }

  /**
   * Verify proof of work
   */
  private verifyProofOfWork(block: QuantumBlock): boolean {
    const target = '0'.repeat(this.difficulty);
    return block.hash.substring(0, this.difficulty) === target;
  }

  /**
   * Resolve chain conflicts (longest valid chain wins)
   */
  async resolveConflicts(
    localChain: QuantumBlock[],
    peerChain: QuantumBlock[]
  ): Promise<{
    shouldReplace: boolean;
    winningChain: QuantumBlock[];
    reason: string;
  }> {
    // Simple longest chain rule
    if (peerChain.length <= localChain.length) {
      return {
        shouldReplace: false,
        winningChain: localChain,
        reason: 'Local chain is longer or equal'
      };
    }

    // Validate the peer chain
    for (let i = 1; i < peerChain.length; i++) {
      const result = this.validateBlock(peerChain[i], peerChain[i - 1]);
      if (!result.accepted) {
        return {
          shouldReplace: false,
          winningChain: localChain,
          reason: `Invalid peer chain: ${result.reason}`
        };
      }
    }

    // Calculate cumulative difficulty
    const localDifficulty = this.calculateChainDifficulty(localChain);
    const peerDifficulty = this.calculateChainDifficulty(peerChain);

    if (peerDifficulty > localDifficulty) {
      return {
        shouldReplace: true,
        winningChain: peerChain,
        reason: 'Peer chain has more cumulative work'
      };
    }

    return {
      shouldReplace: false,
      winningChain: localChain,
      reason: 'Local chain has more or equal cumulative work'
    };
  }

  /**
   * Calculate cumulative difficulty of chain
   */
  private calculateChainDifficulty(chain: QuantumBlock[]): number {
    return chain.reduce((total, block) => {
      return total + Math.pow(2, block.difficulty);
    }, 0);
  }

  /**
   * Request chain synchronization from peers
   */
  async synchronizeChain(localHeight: number): Promise<QuantumBlock[]> {
    console.log(`Requesting chain sync from peers (local height: ${localHeight})`);
    
    const connectedPeers = this.network.getConnectedPeers();
    if (connectedPeers.length === 0) {
      console.log('No connected peers for sync');
      return [];
    }

    // Request blocks from a random peer
    const randomPeer = connectedPeers[Math.floor(Math.random() * connectedPeers.length)];
    
    await this.network.sendToPeer(randomPeer, {
      type: 'sync_request',
      data: { fromIndex: localHeight }
    });

    // In production, would wait for response and handle timeout
    // For now, return empty array as sync is async
    return [];
  }

  /**
   * Broadcast new block to network
   */
  async broadcastBlock(block: QuantumBlock): Promise<number> {
    console.log(`Broadcasting block ${block.index} to network`);
    
    return await this.network.broadcast({
      type: 'block',
      data: block
    });
  }

  /**
   * Check if block is already known
   */
  async isBlockKnown(blockHash: string, knownBlocks: QuantumBlock[]): Promise<boolean> {
    return knownBlocks.some(b => b.hash === blockHash);
  }

  /**
   * Get consensus parameters
   */
  getConsensusParams() {
    return {
      difficulty: this.difficulty,
      minConfirmations: this.MIN_CONFIRMATIONS,
      algorithm: 'Proof-of-Work'
    };
  }

  /**
   * Adjust difficulty (simplified)
   */
  adjustDifficulty(recentBlocks: QuantumBlock[]) {
    if (recentBlocks.length < 10) return;

    const last10 = recentBlocks.slice(-10);
    const avgTime = this.calculateAverageBlockTime(last10);
    const TARGET_TIME = 10000; // 10 seconds target

    if (avgTime < TARGET_TIME * 0.5) {
      this.difficulty++;
      console.log(`Difficulty increased to ${this.difficulty}`);
    } else if (avgTime > TARGET_TIME * 2) {
      this.difficulty = Math.max(1, this.difficulty - 1);
      console.log(`Difficulty decreased to ${this.difficulty}`);
    }
  }

  /**
   * Calculate average block time
   */
  private calculateAverageBlockTime(blocks: QuantumBlock[]): number {
    if (blocks.length < 2) return 0;

    let totalTime = 0;
    for (let i = 1; i < blocks.length; i++) {
      const prev = new Date(blocks[i - 1].timestamp).getTime();
      const curr = new Date(blocks[i].timestamp).getTime();
      totalTime += curr - prev;
    }

    return totalTime / (blocks.length - 1);
  }
}
