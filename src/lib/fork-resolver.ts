import { supabase } from '@/integrations/supabase/client';

export interface BlockchainFork {
  id: string;
  forkHeight: number;
  mainChainHash: string;
  forkChainHash: string;
  mainChainWork: bigint;
  forkChainWork: bigint;
  detectedAt: Date;
  resolution?: 'main_chain_won' | 'fork_chain_won';
}

export class ForkResolver {
  async detectFork(
    currentChain: any[],
    receivedChain: any[],
    divergencePoint: number
  ): Promise<BlockchainFork | null> {
    if (divergencePoint < 0 || divergencePoint >= currentChain.length) {
      return null;
    }

    const mainChainWork = this.calculateChainWork(currentChain);
    const forkChainWork = this.calculateChainWork(receivedChain);

    const fork: BlockchainFork = {
      id: crypto.randomUUID(),
      forkHeight: divergencePoint,
      mainChainHash: currentChain[currentChain.length - 1]?.hash || '',
      forkChainHash: receivedChain[receivedChain.length - 1]?.hash || '',
      mainChainWork,
      forkChainWork,
      detectedAt: new Date()
    };

    // Log fork to database
    const { error } = await supabase.from('blockchain_forks').insert({
      main_chain_hash: fork.mainChainHash,
      fork_chain_hash: fork.forkChainHash,
      main_chain_work: parseFloat(fork.mainChainWork.toString()),
      fork_chain_work: parseFloat(fork.forkChainWork.toString()),
      fork_height: fork.forkHeight,
      resolution: 'pending'
    });
    
    if (error) {
      console.error('Failed to log fork:', error);
    }

    return fork;
  }

  async resolveFork(
    fork: BlockchainFork,
    currentChain: any[],
    receivedChain: any[]
  ): Promise<{ shouldReorg: boolean; winningChain: any[] }> {
    // Use Nakamoto consensus: longest chain with most work wins
    const shouldReorg = fork.forkChainWork > fork.mainChainWork;
    
    const resolution = shouldReorg ? 'fork_chain_won' : 'main_chain_won';
    
    // Update fork resolution
    await supabase
      .from('blockchain_forks')
      .update({
        resolution,
        resolved_at: new Date().toISOString()
      })
      .eq('fork_height', fork.forkHeight)
      .eq('main_chain_hash', fork.mainChainHash);

    // Log to audit
    await supabase.from('audit_logs').insert({
      action: 'fork_resolution',
      resource: 'blockchain',
      details: {
        fork_height: fork.forkHeight,
        resolution,
        main_chain_work: fork.mainChainWork.toString(),
        fork_chain_work: fork.forkChainWork.toString(),
        reorg_depth: currentChain.length - fork.forkHeight
      }
    });

    return {
      shouldReorg,
      winningChain: shouldReorg ? receivedChain : currentChain
    };
  }

  calculateChainWork(chain: any[]): bigint {
    return chain.reduce((total, block) => {
      const difficulty = block.difficulty || 1;
      const blockWork = BigInt(2) ** BigInt(difficulty);
      return total + blockWork;
    }, BigInt(0));
  }

  findDivergencePoint(chain1: any[], chain2: any[]): number {
    const minLength = Math.min(chain1.length, chain2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (chain1[i].hash !== chain2[i].hash) {
        return i;
      }
    }
    
    return minLength;
  }

  async getRecentForks(limit: number = 10) {
    const { data } = await supabase
      .from('blockchain_forks')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(limit);

    return data || [];
  }
}
