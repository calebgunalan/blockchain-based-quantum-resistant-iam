import { supabase } from '@/integrations/supabase/client';

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

// Helper to encode bytes to base64
function bytesToBase64(bytes: Uint8Array): string {
  const binString = String.fromCharCode(...bytes);
  return btoa(binString);
}

// Helper to decode base64 to bytes
function base64ToBytes(b64: string): Uint8Array {
  const binString = atob(b64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Quantum Key Cache Manager
 * Uses Web Crypto API for encryption - no libsodium dependency
 */
export class QuantumKeyCache {
  private static readonly CACHE_DURATION_HOURS = 24;
  private static readonly MAX_CACHE_SIZE_PER_USER = 10;

  static async cacheKey(
    userId: string,
    keyType: 'signing' | 'encryption' | 'kem',
    publicKey: Uint8Array,
    privateKey: Uint8Array,
    algorithm: string,
    masterPassword?: string
  ): Promise<string | null> {
    // Encrypt private key using AES-GCM via Web Crypto
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const encKeyBytes = masterPassword
      ? new TextEncoder().encode(masterPassword.padEnd(32, '0').slice(0, 32))
      : crypto.getRandomValues(new Uint8Array(32));

    const cryptoKey = await crypto.subtle.importKey(
      'raw', encKeyBytes, { name: 'AES-GCM' }, false, ['encrypt']
    );
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce }, cryptoKey, privateKey
    );

    // Combine nonce + ciphertext
    const combined = new Uint8Array(nonce.length + new Uint8Array(ciphertext).length);
    combined.set(nonce, 0);
    combined.set(new Uint8Array(ciphertext), nonce.length);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.CACHE_DURATION_HOURS);

    const { data, error } = await supabase
      .from('quantum_key_cache')
      .insert({
        user_id: userId,
        key_type: keyType,
        public_key: bytesToBase64(publicKey),
        private_key_encrypted: bytesToBase64(combined),
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

    if (error || !data) return null;

    await supabase
      .from('quantum_key_cache')
      .update({ cache_hit_count: data.cache_hit_count + 1, last_used_at: new Date().toISOString() })
      .eq('id', data.id);

    const publicKeyBuffer = base64ToBytes(data.public_key as any);
    const privateKeyEncBuffer = base64ToBytes(data.private_key_encrypted as any);

    return {
      id: data.id,
      userId: data.user_id as string,
      keyType: data.key_type as 'signing' | 'encryption' | 'kem',
      publicKey: publicKeyBuffer,
      privateKeyEncrypted: privateKeyEncBuffer,
      algorithm: data.algorithm,
      cacheHitCount: data.cache_hit_count + 1,
      lastUsedAt: new Date(data.last_used_at as string),
      createdAt: new Date(data.created_at as string),
      expiresAt: new Date(data.expires_at),
      isActive: data.is_active
    };
  }

  static async invalidateKey(keyId: string): Promise<boolean> {
    const { error } = await supabase
      .from('quantum_key_cache')
      .update({ is_active: false })
      .eq('id', keyId);
    return !error;
  }

  static async cleanupExpiredCache(): Promise<number> {
    const { data } = await supabase.rpc('cleanup_expired_quantum_cache');
    return data || 0;
  }

  static async getCacheStats(userId: string): Promise<KeyCacheStats> {
    const { data } = await supabase.rpc('get_quantum_cache_stats', { user_id_param: userId });
    if (!data || typeof data !== 'object') {
      return { totalCachedKeys: 0, activeKeys: 0, expiredKeys: 0, totalCacheHits: 0, avgCacheHitsPerKey: 0, cacheHitRate: 0 };
    }
    return data as unknown as KeyCacheStats;
  }

  static async decryptCachedKey(
    encryptedKey: Uint8Array,
    masterPassword: string
  ): Promise<Uint8Array | null> {
    try {
      const nonce = encryptedKey.slice(0, 12);
      const ciphertext = encryptedKey.slice(12);

      const keyBytes = new TextEncoder().encode(masterPassword.padEnd(32, '0').slice(0, 32));
      const cryptoKey = await crypto.subtle.importKey(
        'raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']
      );
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce }, cryptoKey, ciphertext
      );
      return new Uint8Array(plaintext);
    } catch (error) {
      console.error('Failed to decrypt cached key:', error);
      return null;
    }
  }
}
