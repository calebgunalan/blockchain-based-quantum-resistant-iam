/**
 * Blockchain Pruning and Archival System
 * Manages long-term storage and retrieval of blockchain data
 */

import { supabase } from '@/integrations/supabase/client';

export interface PruningPolicy {
  retentionDays: number;
  archiveEnabled: boolean;
  autoArchive: boolean;
  pruneInterval: number; // hours
}

export interface ArchiveMetadata {
  archiveId: string;
  startHeight: number;
  endHeight: number;
  blockCount: number;
  archivedAt: Date;
  compressedSize?: number;
}

/**
 * Default pruning policy
 */
export const DEFAULT_PRUNING_POLICY: PruningPolicy = {
  retentionDays: 90, // Keep 90 days in active blockchain
  archiveEnabled: true,
  autoArchive: true,
  pruneInterval: 24, // Check every 24 hours
};

/**
 * Archive old blocks to separate storage
 */
export async function archiveBlocks(
  startHeight: number,
  endHeight: number
): Promise<ArchiveMetadata> {
  try {
    // Fetch blocks to archive
    const { data: blocks, error: fetchError } = await supabase
      .from('blockchain_blocks')
      .select('*')
      .gte('block_index', startHeight)
      .lte('block_index', endHeight)
      .order('block_index', { ascending: true });

    if (fetchError) throw fetchError;
    if (!blocks || blocks.length === 0) {
      throw new Error('No blocks found in specified range');
    }

    // Fetch associated audit logs
    const blockHashes = blocks.map(b => b.block_hash);
    const { data: auditLogs } = await supabase
      .from('blockchain_audit_logs')
      .select('*')
      .in('block_hash', blockHashes);

    // Create archive record
    const archiveId = `archive-${Date.now()}-${startHeight}-${endHeight}`;
    const archiveData = {
      blocks,
      auditLogs: auditLogs || [],
      metadata: {
        archiveId,
        startHeight,
        endHeight,
        blockCount: blocks.length,
        archivedAt: new Date().toISOString(),
      },
    };

    // Store in blockchain_archives table
    const { error: archiveError } = await supabase
      .from('blockchain_archives')
      .insert({
        archive_id: archiveId,
        start_height: startHeight,
        end_height: endHeight,
        block_count: blocks.length,
        archive_data: archiveData,
      });

    if (archiveError) throw archiveError;

    return {
      archiveId,
      startHeight,
      endHeight,
      blockCount: blocks.length,
      archivedAt: new Date(),
    };
  } catch (error) {
    console.error('Failed to archive blocks:', error);
    throw error;
  }
}

/**
 * Prune archived blocks from active blockchain
 */
export async function pruneArchivedBlocks(
  startHeight: number,
  endHeight: number
): Promise<number> {
  try {
    // Verify blocks are archived first
    const { data: archive } = await supabase
      .from('blockchain_archives')
      .select('archive_id')
      .gte('start_height', startHeight)
      .lte('end_height', endHeight)
      .single();

    if (!archive) {
      throw new Error('Blocks must be archived before pruning');
    }

    // Get block hashes to delete
    const { data: blocks } = await supabase
      .from('blockchain_blocks')
      .select('block_hash')
      .gte('block_index', startHeight)
      .lte('block_index', endHeight);

    if (!blocks) return 0;

    const blockHashes = blocks.map(b => b.block_hash);

    // Delete audit logs first (foreign key constraint)
    await supabase
      .from('blockchain_audit_logs')
      .delete()
      .in('block_hash', blockHashes);

    // Delete blocks
    const { error: deleteError } = await supabase
      .from('blockchain_blocks')
      .delete()
      .gte('block_index', startHeight)
      .lte('block_index', endHeight);

    if (deleteError) throw deleteError;

    return blocks.length;
  } catch (error) {
    console.error('Failed to prune blocks:', error);
    throw error;
  }
}

/**
 * Automatic pruning based on policy
 */
export async function autoprune(policy: PruningPolicy = DEFAULT_PRUNING_POLICY): Promise<{
  archived: number;
  pruned: number;
}> {
  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    // Find blocks older than retention period
    const { data: oldBlocks, error } = await supabase
      .from('blockchain_blocks')
      .select('block_index')
      .lt('created_at', cutoffDate.toISOString())
      .order('block_index', { ascending: true });

    if (error) throw error;
    if (!oldBlocks || oldBlocks.length === 0) {
      return { archived: 0, pruned: 0 };
    }

    const startHeight = oldBlocks[0].block_index;
    const endHeight = oldBlocks[oldBlocks.length - 1].block_index;

    let archivedCount = 0;
    let prunedCount = 0;

    // Archive if enabled
    if (policy.archiveEnabled) {
      const archiveResult = await archiveBlocks(startHeight, endHeight);
      archivedCount = archiveResult.blockCount;
    }

    // Prune if auto-archive is enabled
    if (policy.autoArchive && policy.archiveEnabled) {
      prunedCount = await pruneArchivedBlocks(startHeight, endHeight);
    }

    return { archived: archivedCount, pruned: prunedCount };
  } catch (error) {
    console.error('Auto-pruning failed:', error);
    throw error;
  }
}

/**
 * Restore blocks from archive
 */
export async function restoreFromArchive(archiveId: string): Promise<number> {
  try {
    // Fetch archive data
    const { data: archive, error: fetchError } = await supabase
      .from('blockchain_archives')
      .select('archive_data')
      .eq('archive_id', archiveId)
      .single();

    if (fetchError) throw fetchError;
    if (!archive) throw new Error('Archive not found');

    const archiveData = archive.archive_data as {
      blocks: any[];
      auditLogs: any[];
    };

    // Restore blocks
    const { error: blockError } = await supabase
      .from('blockchain_blocks')
      .insert(archiveData.blocks);

    if (blockError) throw blockError;

    // Restore audit logs
    if (archiveData.auditLogs.length > 0) {
      await supabase
        .from('blockchain_audit_logs')
        .insert(archiveData.auditLogs);
    }

    return archiveData.blocks.length;
  } catch (error) {
    console.error('Failed to restore from archive:', error);
    throw error;
  }
}

/**
 * Get archive statistics
 */
export async function getArchiveStats(): Promise<{
  totalArchives: number;
  totalArchivedBlocks: number;
  oldestArchive: Date | null;
  newestArchive: Date | null;
}> {
  try {
    const { data: archives, error } = await supabase
      .from('blockchain_archives')
      .select('block_count, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!archives || archives.length === 0) {
      return {
        totalArchives: 0,
        totalArchivedBlocks: 0,
        oldestArchive: null,
        newestArchive: null,
      };
    }

    const totalBlocks = archives.reduce((sum, a) => sum + a.block_count, 0);

    return {
      totalArchives: archives.length,
      totalArchivedBlocks: totalBlocks,
      oldestArchive: new Date(archives[0].created_at),
      newestArchive: new Date(archives[archives.length - 1].created_at),
    };
  } catch (error) {
    console.error('Failed to get archive stats:', error);
    throw error;
  }
}

/**
 * List all archives
 */
export async function listArchives(): Promise<ArchiveMetadata[]> {
  try {
    const { data: archives, error } = await supabase
      .from('blockchain_archives')
      .select('archive_id, start_height, end_height, block_count, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!archives) return [];

    return archives.map(a => ({
      archiveId: a.archive_id,
      startHeight: a.start_height,
      endHeight: a.end_height,
      blockCount: a.block_count,
      archivedAt: new Date(a.created_at),
    }));
  } catch (error) {
    console.error('Failed to list archives:', error);
    return [];
  }
}
