import { supabase } from '@/integrations/supabase/client';
import * as sodium from 'libsodium-wrappers';

export interface CachedQuantumKey {
  id: string;
  userId: string;
  keyType: 'signing' | 'encryption' | 'kem';
  publicKey: Uint8Array;
  privateKeyEncrypted: Uint8Array;
  algorithm: string;
  cacheHitCount: number;
  lastUsedAt: Date;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface KeyCacheStats {
  totalCachedKeys: number;
  activeKeys: number;
  expiredKeys: number;
  totalCacheHits: number;
  avgCacheHitsPerKey: number;
  cacheHitRate: number;
}

/**
 * Quantum Key Cache Manager
 * Implements performance optimization through key caching
 */
export class QuantumKeyCache {
  private static readonly CACHE_DURATION_HOURS = 24;
  private static readonly MAX_CACHE_SIZE_PER_USER = 10;

  /**
   * Cache a quantum key for reuse
   */
  static async cacheKey(
    userId: string,
    keyType: 'signing' | 'encryption' | 'kem',
    publicKey: Uint8Array,
    privateKey: Uint8Array,
    algorithm: string,
    masterPassword?: string
  ): Promise<string | null> {
    await sodium.ready;

    // Encrypt private key before caching
    const encryptionKey = masterPassword 
      ? sodium.crypto_pwhash(
          32,
          masterPassword,
          sodium.randombytes_buf(16),
          4,
          33554432,
          sodium.crypto_pwhash_ALG_ARGON2ID13
        )
      : sodium.randombytes_buf(32);

    const nonce = sodium.randombytes_buf(24);
    const privateKeyEncrypted = sodium.crypto_secretbox_easy(
      privateKey,
      nonce,
      encryptionKey
    );

    // Combine nonce + ciphertext
    const combined = new Uint8Array(nonce.length + privateKeyEncrypted.length);
    combined.set(nonce, 0);
    combined.set(privateKeyEncrypted, nonce.length);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.CACHE_DURATION_HOURS);

    const { data, error } = await supabase
      .from('quantum_key_cache')
      .insert({
        user_id: userId,
        key_type: keyType,
        public_key: Buffer.from(publicKey).toString('base64'),
        private_key_encrypted: Buffer.from(combined).toString('base64'),
        algorithm,
        expires_at: expiresAt.toISOString()
      } as any)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to cache key:', error);
      return null;
    }

    return data.id;
  }

  /**
   * Retrieve a cached key
   */
  static async getCachedKey(
    userId: string,
    keyType: 'signing' | 'encryption' | 'kem',
    masterPassword?: string
  ): Promise<CachedQuantumKey | null> {
    const { data, error } = await supabase
      .from('quantum_key_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('key_type', keyType)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('last_used_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    // Update cache hit count
    await supabase
      .from('quantum_key_cache')
      .update({
        cache_hit_count: data.cache_hit_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', data.id);

    // Decode base64 strings back to Uint8Array
    const publicKeyBuffer = Buffer.from(data.public_key as any, 'base64');
    const privateKeyEncBuffer = Buffer.from(data.private_key_encrypted as any, 'base64');

    return {
      id: data.id,
      userId: data.user_id as string,
      keyType: data.key_type as 'signing' | 'encryption' | 'kem',
      publicKey: new Uint8Array(publicKeyBuffer),
      privateKeyEncrypted: new Uint8Array(privateKeyEncBuffer),
      algorithm: data.algorithm,
      cacheHitCount: data.cache_hit_count + 1,
      lastUsedAt: new Date(data.last_used_at as string),
      createdAt: new Date(data.created_at as string),
      expiresAt: new Date(data.expires_at),
      isActive: data.is_active
    };
  }

  /**
   * Invalidate a cached key
   */
  static async invalidateKey(keyId: string): Promise<boolean> {
    const { error } = await supabase
      .from('quantum_key_cache')
      .update({ is_active: false })
      .eq('id', keyId);

    return !error;
  }

  /**
   * Clean up expired cache entries
   */
  static async cleanupExpiredCache(): Promise<number> {
    const { data } = await supabase.rpc('cleanup_expired_quantum_cache');
    return data || 0;
  }

  /**
   * Get cache statistics for a user
   */
  static async getCacheStats(userId: string): Promise<KeyCacheStats> {
    const { data } = await supabase.rpc('get_quantum_cache_stats', {
      user_id_param: userId
    });

    if (!data || typeof data !== 'object') {
      return {
        totalCachedKeys: 0,
        activeKeys: 0,
        expiredKeys: 0,
        totalCacheHits: 0,
        avgCacheHitsPerKey: 0,
        cacheHitRate: 0
      };
    }

    return data as unknown as KeyCacheStats;
  }

  /**
   * Decrypt cached private key
   */
  static async decryptCachedKey(
    encryptedKey: Uint8Array,
    masterPassword: string
  ): Promise<Uint8Array | null> {
    await sodium.ready;

    try {
      // Extract nonce and ciphertext
      const nonce = encryptedKey.slice(0, 24);
      const ciphertext = encryptedKey.slice(24);

      // Derive decryption key
      const decryptionKey = sodium.crypto_pwhash(
        32,
        masterPassword,
        nonce,
        4,
        33554432,
        sodium.crypto_pwhash_ALG_ARGON2ID13
      );

      // Decrypt
      const privateKey = sodium.crypto_secretbox_open_easy(
        ciphertext,
        nonce,
        decryptionKey
      );

      return privateKey;
    } catch (error) {
      console.error('Failed to decrypt cached key:', error);
      return null;
    }
  }
}
