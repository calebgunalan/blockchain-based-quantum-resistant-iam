import { PostQuantumKEM } from './quantum-pqc';

/**
 * Post-Quantum Database Encryption
 * Application-level encryption for sensitive database fields using ML-KEM
 */

export interface EncryptedField {
  ciphertext: string; // Base64 encoded
  nonce: string; // Base64 encoded
  keyId: string; // Reference to encryption key
  algorithm: 'ML-KEM-768' | 'ML-KEM-1024';
  timestamp: string;
}

export interface EncryptionKey {
  keyId: string;
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  algorithm: 'ML-KEM-768' | 'ML-KEM-1024';
  createdAt: Date;
  rotatedAt?: Date;
}

export class PQCDatabaseEncryption {
  private static keys = new Map<string, EncryptionKey>();
  private static currentKeyId: string | null = null;

  /**
   * Initialize encryption with master key
   */
  static async initialize(): Promise<string> {
    const keyPair = await PostQuantumKEM.generateKeyPair768();
    const keyId = await this.generateKeyId();

    const key: EncryptionKey = {
      keyId,
      publicKey: keyPair.publicKey,
      secretKey: keyPair.secretKey,
      algorithm: 'ML-KEM-768',
      createdAt: new Date()
    };

    this.keys.set(keyId, key);
    this.currentKeyId = keyId;

    return keyId;
  }

  /**
   * Generate unique key ID
   */
  private static async generateKeyId(): Promise<string> {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Encrypt field value
   */
  static async encryptField(
    value: string,
    keyId?: string
  ): Promise<EncryptedField> {
    const useKeyId = keyId || this.currentKeyId;
    if (!useKeyId) {
      throw new Error('No encryption key available. Call initialize() first.');
    }

    const key = this.keys.get(useKeyId);
    if (!key) {
      throw new Error(`Encryption key ${useKeyId} not found`);
    }

    // Generate ephemeral keypair and encapsulate
    const { sharedSecret, ciphertext: encapsulatedKey } = 
      await PostQuantumKEM.encapsulate768(key.publicKey);

    // Use shared secret to encrypt data with AES-256-GCM
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const aesKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret.slice(0, 32),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      aesKey,
      encoder.encode(value)
    );

    // Combine encapsulated key and encrypted data
    const combined = new Uint8Array([
      ...encapsulatedKey,
      ...new Uint8Array(encrypted)
    ]);

    return {
      ciphertext: btoa(String.fromCharCode(...combined)),
      nonce: btoa(String.fromCharCode(...nonce)),
      keyId: useKeyId,
      algorithm: key.algorithm,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Decrypt field value
   */
  static async decryptField(encrypted: EncryptedField): Promise<string> {
    const key = this.keys.get(encrypted.keyId);
    if (!key) {
      throw new Error(`Decryption key ${encrypted.keyId} not found`);
    }

    // Decode ciphertext
    const combined = Uint8Array.from(atob(encrypted.ciphertext), c => c.charCodeAt(0));
    const nonce = Uint8Array.from(atob(encrypted.nonce), c => c.charCodeAt(0));

    // Split encapsulated key and data (ML-KEM-768 ciphertext is 1088 bytes)
    const kemCiphertextSize = 1088;
    const encapsulatedKey = combined.slice(0, kemCiphertextSize);
    const ciphertext = combined.slice(kemCiphertextSize);

    // Decapsulate to get shared secret
    const sharedSecret = await PostQuantumKEM.decapsulate768(
      encapsulatedKey,
      key.secretKey
    );

    // Decrypt data
    const aesKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret.slice(0, 32),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      aesKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Rotate encryption key
   */
  static async rotateKey(): Promise<string> {
    const keyPair = await PostQuantumKEM.generateKeyPair768();
    const keyId = await this.generateKeyId();

    const key: EncryptionKey = {
      keyId,
      publicKey: keyPair.publicKey,
      secretKey: keyPair.secretKey,
      algorithm: 'ML-KEM-768',
      createdAt: new Date()
    };

    // Mark old key as rotated
    if (this.currentKeyId) {
      const oldKey = this.keys.get(this.currentKeyId);
      if (oldKey) {
        oldKey.rotatedAt = new Date();
      }
    }

    this.keys.set(keyId, key);
    this.currentKeyId = keyId;

    return keyId;
  }

  /**
   * Re-encrypt field with new key
   */
  static async reencryptField(
    encrypted: EncryptedField,
    newKeyId?: string
  ): Promise<EncryptedField> {
    // Decrypt with old key
    const plaintext = await this.decryptField(encrypted);
    
    // Encrypt with new key
    return await this.encryptField(plaintext, newKeyId);
  }

  /**
   * Batch encrypt multiple fields
   */
  static async encryptFields(
    fields: Record<string, string>
  ): Promise<Record<string, EncryptedField>> {
    const encrypted: Record<string, EncryptedField> = {};
    
    for (const [key, value] of Object.entries(fields)) {
      encrypted[key] = await this.encryptField(value);
    }
    
    return encrypted;
  }

  /**
   * Batch decrypt multiple fields
   */
  static async decryptFields(
    fields: Record<string, EncryptedField>
  ): Promise<Record<string, string>> {
    const decrypted: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(fields)) {
      decrypted[key] = await this.decryptField(value);
    }
    
    return decrypted;
  }

  /**
   * Get current key info
   */
  static getCurrentKey(): EncryptionKey | null {
    if (!this.currentKeyId) return null;
    return this.keys.get(this.currentKeyId) || null;
  }

  /**
   * Get all keys
   */
  static getAllKeys(): EncryptionKey[] {
    return Array.from(this.keys.values());
  }

  /**
   * Delete old keys (keep only current and one previous)
   */
  static cleanOldKeys(): number {
    if (!this.currentKeyId) return 0;

    const allKeys = Array.from(this.keys.entries())
      .sort((a, b) => b[1].createdAt.getTime() - a[1].createdAt.getTime());

    let deleted = 0;
    // Keep only current and previous key
    for (let i = 2; i < allKeys.length; i++) {
      this.keys.delete(allKeys[i][0]);
      deleted++;
    }

    return deleted;
  }

  /**
   * Export key for backup (encrypted)
   */
  static async exportKey(
    keyId: string,
    password: string
  ): Promise<string> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Key ${keyId} not found`);
    }

    // Derive encryption key from password
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const aesKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Encrypt key data
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const keyData = JSON.stringify({
      keyId: key.keyId,
      publicKey: Array.from(key.publicKey),
      secretKey: Array.from(key.secretKey),
      algorithm: key.algorithm,
      createdAt: key.createdAt.toISOString()
    });

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      aesKey,
      encoder.encode(keyData)
    );

    // Combine salt, nonce, and encrypted data
    const combined = new Uint8Array([
      ...salt,
      ...nonce,
      ...new Uint8Array(encrypted)
    ]);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Import key from backup
   */
  static async importKey(
    encryptedKey: string,
    password: string
  ): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const nonce = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    // Derive decryption key from password
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const aesKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      aesKey,
      ciphertext
    );

    const keyData = JSON.parse(new TextDecoder().decode(decrypted));

    // Restore key
    const key: EncryptionKey = {
      keyId: keyData.keyId,
      publicKey: new Uint8Array(keyData.publicKey),
      secretKey: new Uint8Array(keyData.secretKey),
      algorithm: keyData.algorithm,
      createdAt: new Date(keyData.createdAt)
    };

    this.keys.set(key.keyId, key);
    return key.keyId;
  }
}
