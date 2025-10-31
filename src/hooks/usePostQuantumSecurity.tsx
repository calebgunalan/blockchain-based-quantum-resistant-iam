import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  PostQuantumKEM, 
  PostQuantumSignatures, 
  HybridCrypto,
  QuantumAttackDetector,
  PQMigration 
} from '@/lib/quantum-pqc';
import { QuantumKEM, QuantumSignatures } from '@/lib/quantum-crypto';
import { toast } from '@/hooks/use-toast';

export interface PQKeyPair {
  id: string;
  algorithm: 'ML-KEM-768' | 'ML-KEM-1024' | 'ML-DSA-65' | 'ML-DSA-87';
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  createdAt: Date;
  expiresAt: Date;
}

export interface QuantumThreatStatus {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  usingPostQuantum: boolean;
  vulnerableOperations: number;
  lastAssessment: Date;
  recommendations: string[];
}

export function usePostQuantumSecurity() {
  const { user } = useAuth();
  const [pqEnabled, setPQEnabled] = useState(false);
  const [hybridMode, setHybridMode] = useState(true);
  const [threatStatus, setThreatStatus] = useState<QuantumThreatStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkPQStatus();
      assessQuantumThreats();
    }
  }, [user]);

  const checkPQStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_quantum_settings')
        .select('post_quantum_enabled, hybrid_mode_enabled')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setPQEnabled(data?.post_quantum_enabled || false);
      setHybridMode(data?.hybrid_mode_enabled !== false); // Default to true
    } catch (error) {
      console.error('Error checking PQ status:', error);
    } finally {
      setLoading(false);
    }
  };

  const assessQuantumThreats = async () => {
    try {
      // Check for vulnerable operations in audit logs
      const { data: recentOps } = await supabase
        .from('audit_logs')
        .select('action, details')
        .eq('user_id', user?.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      let vulnerableCount = 0;
      const recommendations: string[] = [];

      recentOps?.forEach(op => {
        const details = typeof op.details === 'object' && op.details !== null ? op.details : {};
        const detection = QuantumAttackDetector.detectAttackPattern(
          op.action,
          details as Record<string, any>
        );
        if (detection.isQuantumThreat) {
          vulnerableCount++;
        }
      });

      // Assess overall risk
      let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      if (!pqEnabled) {
        overallRisk = 'high';
        recommendations.push('Enable post-quantum cryptography immediately');
        recommendations.push('Quantum computers pose real threat to current encryption');
      } else if (!hybridMode) {
        overallRisk = 'medium';
        recommendations.push('Enable hybrid mode for defense-in-depth');
      }

      if (vulnerableCount > 10) {
        overallRisk = 'critical';
        recommendations.push(`${vulnerableCount} vulnerable operations detected in last 7 days`);
      }

      setThreatStatus({
        overallRisk,
        usingPostQuantum: pqEnabled,
        vulnerableOperations: vulnerableCount,
        lastAssessment: new Date(),
        recommendations
      });
    } catch (error) {
      console.error('Error assessing quantum threats:', error);
    }
  };

  const enablePostQuantumSecurity = async (securityLevel: 'standard' | 'high' | 'top-secret' = 'high') => {
    try {
      setLoading(true);

      // Generate ML-KEM key pair
      const kemKeyPair = securityLevel === 'top-secret' 
        ? await PostQuantumKEM.generateKeyPair1024()
        : await PostQuantumKEM.generateKeyPair768();

      // Generate ML-DSA key pair
      const sigKeyPair = securityLevel === 'top-secret'
        ? await PostQuantumSignatures.generateKeyPair87()
        : await PostQuantumSignatures.generateKeyPair65();

      // Also generate classical keys for hybrid mode
      const classicalKEM = await QuantumKEM.generateKeyPair();
      const classicalSig = await QuantumSignatures.generateKeyPair();

      // Extract secret keys properly (they might be called secretKey or privateKey)
      const kemSecret = (kemKeyPair as any).secretKey || (kemKeyPair as any).privateKey;
      const sigSecret = (sigKeyPair as any).secretKey || (sigKeyPair as any).privateKey;

      // Store keys in database
      const { error: kemError } = await supabase
        .from('quantum_keys')
        .insert({
          user_id: user?.id,
          key_type: 'kem',
          algorithm: securityLevel === 'top-secret' ? 'ML-KEM-1024' : 'ML-KEM-768',
          public_key: Array.from(kemKeyPair.publicKey).join(','),
          is_post_quantum: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (kemError) throw kemError;

      const { error: sigError } = await supabase
        .from('quantum_keys')
        .insert({
          user_id: user?.id,
          key_type: 'signature',
          algorithm: securityLevel === 'top-secret' ? 'ML-DSA-87' : 'ML-DSA-65',
          public_key: Array.from(sigKeyPair.publicKey).join(','),
          is_post_quantum: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (sigError) throw sigError;

      // Update user settings
      const { error: settingsError } = await supabase
        .from('user_quantum_settings')
        .upsert({
          user_id: user?.id,
          post_quantum_enabled: true,
          hybrid_mode_enabled: true,
          security_level: securityLevel,
          pq_kem_private_key_encrypted: Array.from(kemSecret).join(','),
          pq_sig_private_key_encrypted: Array.from(sigSecret).join(','),
          classical_kem_private_key_encrypted: Array.from(classicalKEM.privateKey).join(','),
          classical_sig_private_key_encrypted: Array.from(classicalSig.privateKey).join(',')
        }, { onConflict: 'user_id' });

      if (settingsError) throw settingsError;

      // Log the security upgrade
      await supabase.rpc('log_audit_event', {
        _action: 'POST_QUANTUM_ENABLED',
        _resource: 'quantum_security',
        _details: {
          security_level: securityLevel,
          algorithms: [`ML-KEM-${securityLevel === 'top-secret' ? '1024' : '768'}`, `ML-DSA-${securityLevel === 'top-secret' ? '87' : '65'}`],
          hybrid_mode: true
        }
      });

      setPQEnabled(true);
      setHybridMode(true);
      await assessQuantumThreats();

      toast({
        title: "Post-Quantum Security Enabled",
        description: `Your account is now protected with ${securityLevel} level quantum-resistant cryptography.`,
      });

      return { kemKeyPair, sigKeyPair, classicalKEM, classicalSig };
    } catch (error) {
      console.error('Error enabling post-quantum security:', error);
      toast({
        title: "Error",
        description: "Failed to enable post-quantum security",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const performHybridKeyExchange = async (recipientPublicKeys: {
    classical: Uint8Array;
    postQuantum: Uint8Array;
  }) => {
    try {
      // Get user's private keys from settings
      const { data: settings } = await supabase
        .from('user_quantum_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (!settings) throw new Error('No quantum settings found');

      // Perform hybrid key exchange
      const result = await HybridCrypto.hybridKeyExchange(
        recipientPublicKeys.classical,
        recipientPublicKeys.postQuantum,
        async (pk) => {
          const { sharedSecret, ciphertext } = await QuantumKEM.encapsulate(pk);
          return { sharedSecret, ciphertext };
        }
      );

      // Log the secure key exchange
      await supabase.rpc('log_audit_event', {
        _action: 'HYBRID_KEY_EXCHANGE',
        _resource: 'quantum_keys',
        _details: {
          mode: 'hybrid',
          algorithms: ['X25519', 'ML-KEM-768']
        }
      });

      return result;
    } catch (error) {
      console.error('Error in hybrid key exchange:', error);
      throw error;
    }
  };

  const signWithPostQuantum = async (message: string) => {
    try {
      const { data: settings } = await supabase
        .from('user_quantum_settings')
        .select('pq_sig_private_key_encrypted, classical_sig_private_key_encrypted')
        .eq('user_id', user?.id)
        .single();

      if (!settings) throw new Error('No signing keys found');

      const pqSecretKey = new Uint8Array(settings.pq_sig_private_key_encrypted.split(',').map(Number));
      const classicalSecretKey = new Uint8Array(settings.classical_sig_private_key_encrypted.split(',').map(Number));
      const messageBytes = new TextEncoder().encode(message);

      if (hybridMode) {
        // Hybrid signature
        const signatures = await HybridCrypto.hybridSign(
          messageBytes,
          classicalSecretKey,
          pqSecretKey,
          async (msg, sk) => QuantumSignatures.sign(msg, sk)
        );

        return {
          classical: Array.from(signatures.classicalSig).join(','),
          postQuantum: Array.from(signatures.pqSig).join(','),
          mode: 'hybrid'
        };
      } else {
        // Pure post-quantum signature
        const pqSig = await PostQuantumSignatures.sign65(messageBytes, pqSecretKey);
        return {
          postQuantum: Array.from(pqSig).join(','),
          mode: 'post-quantum'
        };
      }
    } catch (error) {
      console.error('Error signing with post-quantum:', error);
      throw error;
    }
  };

  const verifyPostQuantumSignature = async (
    message: string,
    signatures: { classical?: string; postQuantum: string },
    publicKeys: { classical?: Uint8Array; postQuantum: Uint8Array }
  ): Promise<boolean> => {
    try {
      const messageBytes = new TextEncoder().encode(message);

      if (signatures.classical && publicKeys.classical) {
        // Hybrid verification
        const classicalSig = new Uint8Array(signatures.classical.split(',').map(Number));
        const pqSig = new Uint8Array(signatures.postQuantum.split(',').map(Number));

        return await HybridCrypto.hybridVerify(
          messageBytes,
          classicalSig,
          pqSig,
          publicKeys.classical,
          publicKeys.postQuantum,
          async (sig, msg, pk) => QuantumSignatures.verify(sig, msg, pk)
        );
      } else {
        // Pure post-quantum verification
        const pqSig = new Uint8Array(signatures.postQuantum.split(',').map(Number));
        return await PostQuantumSignatures.verify65(pqSig, messageBytes, publicKeys.postQuantum);
      }
    } catch (error) {
      console.error('Error verifying post-quantum signature:', error);
      return false;
    }
  };

  const getMigrationPlan = () => {
    const currentAlg = pqEnabled ? 'ML-KEM-768' : 'X25519';
    const securityReq = 'high'; // Could be configurable
    
    return PQMigration.generateMigrationPlan(currentAlg, securityReq);
  };

  const detectQuantumAttack = async (operationType: string, metadata: Record<string, any>) => {
    const detection = QuantumAttackDetector.detectAttackPattern(operationType, metadata);
    
    if (detection.isQuantumThreat) {
      // Log the potential attack
      await supabase
        .from('quantum_attack_logs')
        .insert({
          attack_type: detection.attackType || 'UNKNOWN',
          severity: detection.severity,
          detection_method: 'pattern_analysis',
          attack_signature: JSON.stringify(metadata),
          target_user_id: user?.id,
          is_blocked: detection.severity === 'critical',
          metadata: detection
        });

      toast({
        title: "Quantum Threat Detected",
        description: detection.details,
        variant: detection.severity === 'critical' ? 'destructive' : 'default'
      });
    }

    return detection;
  };

  return {
    pqEnabled,
    hybridMode,
    threatStatus,
    loading,
    enablePostQuantumSecurity,
    performHybridKeyExchange,
    signWithPostQuantum,
    verifyPostQuantumSignature,
    getMigrationPlan,
    detectQuantumAttack,
    assessQuantumThreats,
    checkPQStatus
  };
}
