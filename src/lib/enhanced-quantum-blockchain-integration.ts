/**
 * Integration Module for Enhanced Quantum Blockchain
 * Connects the new blockchain with existing system components
 */

import { EnhancedQuantumBlockchain, IBlockData } from './enhanced-quantum-blockchain';
import { supabase } from '@/integrations/supabase/client';

export class BlockchainIntegrationManager {
  private blockchain: EnhancedQuantumBlockchain;

  constructor(difficulty: number = 2) {
    this.blockchain = new EnhancedQuantumBlockchain(difficulty);
  }

  /**
   * Initialize blockchain with stored data from Supabase
   */
  async initialize(): Promise<void> {
    await this.blockchain.initializeKeys();
    
    // Load existing blocks from database if any
    const { data: blocks } = await supabase
      .from('blockchain_blocks')
      .select('*')
      .order('block_index', { ascending: true });

    if (blocks && blocks.length > 0) {
      console.log(`Loaded ${blocks.length} blocks from database`);
    }
  }

  /**
   * Log audit event to blockchain
   */
  async logAuditEvent(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, any>
  ): Promise<string> {
    const transaction: IBlockData = {
      type: 'AUDIT_LOG',
      payload: {
        action,
        resource,
        details
      },
      userId,
      timestamp: Date.now()
    };

    this.blockchain.addTransaction(transaction);

    // Mine block every 5 transactions or on demand
    if (this.blockchain.pendingTransactions.length >= 5) {
      const block = await this.blockchain.minePendingTransactions(userId);
      
      // Store in database
      await supabase.from('blockchain_blocks').insert({
        block_index: block.index,
        block_hash: block.hash,
        previous_hash: block.previousHash,
        merkle_root: block.merkleRoot,
        miner_id: userId,
        nonce: block.nonce,
        difficulty: block.difficulty,
        transaction_count: block.data.length
      });

      return block.hash;
    }

    return 'pending';
  }

  /**
   * Verify blockchain integrity
   */
  async verifyIntegrity(): Promise<boolean> {
    return await this.blockchain.isValidChain();
  }

  /**
   * Export audit report
   */
  async exportAuditReport(): Promise<string> {
    const { BlockchainAuditExporter } = await import('./enhanced-quantum-blockchain');
    return await BlockchainAuditExporter.generateAuditReport(this.blockchain);
  }

  /**
   * Get blockchain statistics
   */
  getStatistics() {
    return this.blockchain.getStatistics();
  }

  /**
   * Export to W3C Verifiable Credentials
   */
  exportVerifiableCredentials() {
    return this.blockchain.exportToVerifiableCredentials();
  }

  /**
   * Get the blockchain instance
   */
  getBlockchain(): EnhancedQuantumBlockchain {
    return this.blockchain;
  }
}
