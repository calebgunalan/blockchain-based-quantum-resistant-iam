import { supabase } from '@/integrations/supabase/client';

export interface Transaction {
  id: string;
  data: any;
  fee: number;
  sizeBytes: number;
  senderId?: string;
  timestamp: number;
}

export class TransactionPool {
  private maxPoolSize: number = 1000;
  private minFee: number = 0.0001;

  async addTransaction(transaction: Transaction): Promise<boolean> {
    // Validate transaction
    if (!this.validateTransaction(transaction)) {
      return false;
    }

    // Calculate priority score
    const age = Math.floor((Date.now() - transaction.timestamp) / 1000);
    const { data: priorityData } = await supabase.rpc('calculate_transaction_priority', {
      fee: transaction.fee,
      size_bytes: transaction.sizeBytes,
      age_seconds: age
    });

    const priority = priorityData || 0;

    // Insert into mempool
    const { error } = await supabase
      .from('blockchain_mempool')
      .insert({
        transaction_id: transaction.id,
        transaction_data: transaction.data,
        transaction_fee: transaction.fee,
        sender_id: transaction.senderId,
        size_bytes: transaction.sizeBytes,
        priority_score: priority,
        status: 'pending'
      });

    return !error;
  }

  async getPendingTransactions(limit: number = 100): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('blockchain_mempool')
      .select('*')
      .eq('status', 'pending')
      .order('priority_score', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map(tx => ({
      id: tx.transaction_id,
      data: tx.transaction_data,
      fee: parseFloat(tx.transaction_fee?.toString() || '0'),
      sizeBytes: tx.size_bytes,
      senderId: tx.sender_id || undefined,
      timestamp: new Date(tx.received_at).getTime()
    }));
  }

  async markAsConfirmed(transactionIds: string[], blockHash: string): Promise<void> {
    await supabase
      .from('blockchain_mempool')
      .update({
        status: 'confirmed',
        included_in_block: blockHash
      })
      .in('transaction_id', transactionIds);
  }

  async removePendingTransactions(transactionIds: string[]): Promise<void> {
    await supabase
      .from('blockchain_mempool')
      .delete()
      .in('transaction_id', transactionIds)
      .eq('status', 'pending');
  }

  async getPoolStats() {
    const { data } = await supabase.rpc('get_mempool_stats');
    return data || {
      pending_count: 0,
      total_fees: 0,
      avg_fee: 0,
      total_size_bytes: 0
    };
  }

  private validateTransaction(tx: Transaction): boolean {
    if (!tx.id || !tx.data) return false;
    if (tx.fee < this.minFee) return false;
    if (tx.sizeBytes <= 0 || tx.sizeBytes > 1000000) return false;
    return true;
  }

  async cleanOldTransactions(maxAgeHours: number = 24): Promise<void> {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    await supabase
      .from('blockchain_mempool')
      .delete()
      .eq('status', 'pending')
      .lt('received_at', cutoffTime.toISOString());
  }
}
