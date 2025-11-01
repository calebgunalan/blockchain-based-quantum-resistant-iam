import { supabase } from '@/integrations/supabase/client';

export interface EconomicConfig {
  baseBlockReward: number;
  halvingInterval: number;
  minTransactionFee: number;
  feePerByte: number;
}

export class BlockchainEconomics {
  private config: EconomicConfig = {
    baseBlockReward: 50,
    halvingInterval: 210000, // Blocks until reward halves
    minTransactionFee: 0.0001,
    feePerByte: 0.00000001
  };

  calculateBlockReward(blockHeight: number): number {
    const halvings = Math.floor(blockHeight / this.config.halvingInterval);
    return this.config.baseBlockReward / Math.pow(2, halvings);
  }

  calculateTransactionFee(sizeBytes: number, priorityMultiplier: number = 1): number {
    const baseFee = sizeBytes * this.config.feePerByte * priorityMultiplier;
    return Math.max(baseFee, this.config.minTransactionFee);
  }

  async getUserBalance(userId: string): Promise<number> {
    const { data } = await supabase
      .from('user_token_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();

    return parseFloat(data?.balance?.toString() || '0');
  }

  async updateBalance(userId: string, amount: number, type: 'earn' | 'spend'): Promise<boolean> {
    const { data: current } = await supabase
      .from('user_token_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!current) {
      // Initialize balance
      const { error } = await supabase
        .from('user_token_balances')
        .insert({
          user_id: userId,
          balance: type === 'earn' ? amount : 0,
          total_earned: type === 'earn' ? amount : 0,
          total_spent: type === 'spend' ? amount : 0
        });
      return !error;
    }

    const newBalance = parseFloat(current.balance.toString()) + (type === 'earn' ? amount : -amount);
    
    if (newBalance < 0) {
      return false; // Insufficient balance
    }

    const { error } = await supabase
      .from('user_token_balances')
      .update({
        balance: newBalance,
        total_earned: type === 'earn' 
          ? parseFloat(current.total_earned.toString()) + amount
          : parseFloat(current.total_earned.toString()),
        total_spent: type === 'spend' 
          ? parseFloat(current.total_spent.toString()) + amount
          : parseFloat(current.total_spent.toString()),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    return !error;
  }

  async distributeBlockReward(minerId: string, blockHeight: number, totalFees: number): Promise<void> {
    const blockReward = this.calculateBlockReward(blockHeight);
    const totalReward = blockReward + totalFees;

    await this.updateBalance(minerId, totalReward, 'earn');

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      user_id: minerId,
      action: 'mining_reward',
      resource: 'blockchain',
      details: {
        block_height: blockHeight,
        block_reward: blockReward,
        transaction_fees: totalFees,
        total_reward: totalReward
      }
    });
  }

  async getNetworkStats() {
    const { data: balances } = await supabase
      .from('user_token_balances')
      .select('balance, total_earned, total_spent');

    const totalSupply = balances?.reduce((sum, b) => sum + parseFloat(b.balance.toString()), 0) || 0;
    const totalEarned = balances?.reduce((sum, b) => sum + parseFloat(b.total_earned.toString()), 0) || 0;
    const totalSpent = balances?.reduce((sum, b) => sum + parseFloat(b.total_spent.toString()), 0) || 0;

    return {
      totalSupply,
      totalEarned,
      totalSpent,
      circulatingSupply: totalSupply,
      activeAccounts: balances?.filter(b => parseFloat(b.balance.toString()) > 0).length || 0
    };
  }
}
