import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useBlockchain } from './useBlockchain';
import { supabase } from '@/integrations/supabase/client';
import { 
  crossChainBridge, 
  CrossChainIdentity, 
  NetworkIdentity,
  BlockchainNetwork,
  CrossChainMessage
} from '@/lib/cross-chain-identity';
import { toast } from '@/hooks/use-toast';

export function useCrossChainIdentity() {
  const { user } = useAuth();
  const { did } = useBlockchain();
  const [crossChainIdentity, setCrossChainIdentity] = useState<CrossChainIdentity | null>(null);
  const [linkedNetworks, setLinkedNetworks] = useState<NetworkIdentity[]>([]);
  const [pendingMessages, setPendingMessages] = useState<CrossChainMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user && did) {
      initializeCrossChainIdentity();
      loadLinkedNetworks();
      loadPendingMessages();
    }
  }, [user, did]);

  const initializeCrossChainIdentity = async () => {
    try {
      setLoading(true);

      if (!did) return;

      // Check if cross-chain identity exists
      const { data: existingIdentity } = await supabase
        .from('cross_chain_identities')
        .select('*')
        .eq('primary_did', did.id)
        .maybeSingle();

      if (existingIdentity) {
        // Load existing identity
        const identity = crossChainBridge.getCrossChainIdentity(did.id);
        if (identity) {
          setCrossChainIdentity(identity);
        }
      } else {
        // Create new cross-chain identity
        const identity = await crossChainBridge.createCrossChainIdentity(did);
        
        // Store in database
        await supabase
          .from('cross_chain_identities')
          .insert({
            user_id: user?.id,
            primary_did: did.id,
            identity_data: identity as any,
          });

        setCrossChainIdentity(identity);

        toast({
          title: "Cross-Chain Identity Created",
          description: "Your identity is now ready for multi-chain use",
        });
      }
    } catch (error) {
      console.error('Error initializing cross-chain identity:', error);
      toast({
        title: "Error",
        description: "Failed to initialize cross-chain identity",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedNetworks = async () => {
    try {
      if (!did) return;

      const { data: networks } = await supabase
        .from('cross_chain_networks')
        .select('*')
        .eq('primary_did', did.id);

      if (networks) {
        const networkIdentities: NetworkIdentity[] = networks.map(n => n.network_identity as any);
        setLinkedNetworks(networkIdentities);
      }
    } catch (error) {
      console.error('Error loading linked networks:', error);
    }
  };

  const loadPendingMessages = useCallback(() => {
    if (!did) return;

    const messages = crossChainBridge.getPendingMessages(did.id);
    setPendingMessages(messages);
  }, [did]);

  const linkToNetwork = async (
    network: BlockchainNetwork,
    networkAddress: string,
    networkPublicKey: string
  ) => {
    try {
      if (!did) throw new Error('DID not found');

      setSyncing(true);

      const networkIdentity = await crossChainBridge.linkToNetwork(
        did.id,
        network,
        networkAddress,
        networkPublicKey
      );

      // Store in database
      await supabase
        .from('cross_chain_networks')
        .insert({
          primary_did: did.id,
          network,
          network_address: networkAddress,
          network_identity: networkIdentity as any,
        });

      // Update state
      setLinkedNetworks(prev => [...prev, networkIdentity]);
      const updatedIdentity = crossChainBridge.getCrossChainIdentity(did.id);
      if (updatedIdentity) {
        setCrossChainIdentity(updatedIdentity);
      }

      toast({
        title: "Network Linked",
        description: `Successfully linked to ${network}`,
      });

      return networkIdentity;
    } catch (error) {
      console.error('Error linking to network:', error);
      toast({
        title: "Error",
        description: "Failed to link to network",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const syncAcrossNetworks = async () => {
    try {
      if (!did) throw new Error('DID not found');

      setSyncing(true);

      await crossChainBridge.syncIdentityAcrossNetworks(did.id);

      // Update sync timestamp in database
      await supabase
        .from('cross_chain_identities')
        .update({ 
          last_synced_at: new Date().toISOString(),
          identity_data: crossChainBridge.getCrossChainIdentity(did.id) as any
        })
        .eq('primary_did', did.id);

      loadPendingMessages();

      toast({
        title: "Identity Synced",
        description: "Your identity has been synced across all networks",
      });
    } catch (error) {
      console.error('Error syncing identity:', error);
      toast({
        title: "Error",
        description: "Failed to sync identity across networks",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const transferPermission = async (
    sourceNetwork: BlockchainNetwork,
    targetNetwork: BlockchainNetwork,
    resource: string,
    action: string
  ) => {
    try {
      if (!did) throw new Error('DID not found');

      const messageId = await crossChainBridge.transferPermission(
        did.id,
        sourceNetwork,
        targetNetwork,
        { resource, action }
      );

      loadPendingMessages();

      toast({
        title: "Permission Transfer Initiated",
        description: `Transferring ${action} permission for ${resource}`,
      });

      return messageId;
    } catch (error) {
      console.error('Error transferring permission:', error);
      toast({
        title: "Error",
        description: "Failed to transfer permission",
        variant: "destructive"
      });
      throw error;
    }
  };

  const resolveIdentityOnNetwork = async (network: BlockchainNetwork) => {
    try {
      if (!did) return null;

      return await crossChainBridge.resolveIdentityOnNetwork(did.id, network);
    } catch (error) {
      console.error('Error resolving identity:', error);
      return null;
    }
  };

  const getStatistics = () => {
    return crossChainBridge.getStatistics();
  };

  return {
    crossChainIdentity,
    linkedNetworks,
    pendingMessages,
    loading,
    syncing,
    linkToNetwork,
    syncAcrossNetworks,
    transferPermission,
    resolveIdentityOnNetwork,
    getStatistics,
    refreshMessages: loadPendingMessages
  };
}
