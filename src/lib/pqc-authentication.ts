import { PostQuantumSignatures, PostQuantumKEM } from './quantum-pqc';
import { aesGcmDecrypt, aesGcmEncrypt } from './crypto-utils';

/**
 * Post-Quantum Cryptography Authentication Module
 * Handles authentication using NIST-approved ML-DSA-65/87 and ML-KEM-768/1024
 */

export interface PQCAuthToken {
  token: string;
  signature: Uint8Array;
  publicKey: Uint8Array;
  algorithm: 'ML-DSA-65' | 'ML-DSA-87';
  issuedAt: Date;
  expiresAt: Date;
}

export interface PQCSessionKey {
  sessionId: string;
  sharedSecret: Uint8Array;
  encapsulatedKey: Uint8Array;
  algorithm: 'ML-KEM-768' | 'ML-KEM-1024';
  createdAt: Date;
}

export class PQCAuthentication {
  /**
   * Generate authentication keypair using ML-DSA-65
   */
  static async generateAuthKeyPair() {
    return await PostQuantumSignatures.generateKeyPair65();
  }

  /**
   * Sign authentication challenge using ML-DSA-65
   */
  static async signChallenge(challenge: string, privateKey: Uint8Array): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const challengeBytes = encoder.encode(challenge);
    return await PostQuantumSignatures.sign65(challengeBytes, privateKey);
  }

  /**
   * Verify authentication signature using ML-DSA-65
   */
  static async verifyChallenge(
    signature: Uint8Array,
    challenge: string,
    publicKey: Uint8Array
  ): Promise<boolean> {
    const encoder = new TextEncoder();
    const challengeBytes = encoder.encode(challenge);
    return await PostQuantumSignatures.verify65(signature, challengeBytes, publicKey);
  }

  /**
   * Generate secure session token with PQC signature
   */
  static async generateAuthToken(
    userId: string,
    privateKey: Uint8Array,
    publicKey: Uint8Array,
    expiresInHours: number = 24
  ): Promise<PQCAuthToken> {
    // Generate random token
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create token payload
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + expiresInHours * 60 * 60 * 1000);
    const payload = JSON.stringify({
      userId,
      token,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString()
    });

    // Sign payload using ML-DSA-65
    const encoder = new TextEncoder();
    const signature = await PostQuantumSignatures.sign65(
      encoder.encode(payload),
      privateKey
    );

    return {
      token,
      signature,
      publicKey,
      algorithm: 'ML-DSA-65',
      issuedAt,
      expiresAt
    };
  }

  /**
   * Verify auth token signature
   */
  static async verifyAuthToken(authToken: PQCAuthToken): Promise<boolean> {
    // Check expiration
    if (new Date() > authToken.expiresAt) {
      return false;
    }

    // Reconstruct payload
    const payload = JSON.stringify({
      userId: authToken.token.substring(0, 36), // Assuming UUID prefix
      token: authToken.token,
      issuedAt: authToken.issuedAt.toISOString(),
      expiresAt: authToken.expiresAt.toISOString()
    });

    const encoder = new TextEncoder();
    return await PostQuantumSignatures.verify65(
      authToken.signature,
      encoder.encode(payload),
      authToken.publicKey
    );
  }

  /**
   * Generate session key using ML-KEM-768
   */
  static async generateSessionKey(
    recipientPublicKey: Uint8Array
  ): Promise<{ sharedSecret: Uint8Array; ciphertext: Uint8Array }> {
    return await PostQuantumKEM.encapsulate768(recipientPublicKey);
  }

  /**
   * Derive session key from encapsulated key using ML-KEM-768
   */
  static async deriveSessionKey(
    ciphertext: Uint8Array,
    privateKey: Uint8Array
  ): Promise<Uint8Array> {
    return await PostQuantumKEM.decapsulate768(ciphertext, privateKey);
  }

  /**
   * Hash token for storage using SHA3-512
   */
  static async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate API key with PQC signature
   */
  static async generateAPIKey(userId: string, privateKey: Uint8Array): Promise<string> {
    const prefix = 'qpqc_'; // Quantum Post-Quantum Cryptography
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const key = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Sign the key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(`${userId}:${key}`);
    const signature = await PostQuantumSignatures.sign65(keyData, privateKey);
    
    // Encode signature
    const signatureHex = Array.from(signature.slice(0, 16)) // First 16 bytes
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return `${prefix}${key}_${signatureHex}`;
  }

  /**
   * Encrypt data using session key
   */
  static async encrypt(data: Uint8Array, sessionKey: Uint8Array): Promise<{
    ciphertext: Uint8Array;
    nonce: Uint8Array;
  }> {
    // Use AES-GCM for symmetric encryption (quantum-safe with large keys)
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const keyData = new Uint8Array(sessionKey.slice(0, 32));
    const key = await crypto.subtle.importKey(
      'raw',
      keyData.buffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const encryptedData = await aesGcmEncrypt(data, key, nonce);
    
    return {
      ciphertext: new Uint8Array(encryptedData),
      nonce
    };
  }

  /**
   * Decrypt data using session key
   */
  static async decrypt(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    sessionKey: Uint8Array
  ): Promise<Uint8Array> {
    const keyData = new Uint8Array(sessionKey.slice(0, 32));
    const key = await crypto.subtle.importKey(
      'raw',
      keyData.buffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decryptedData = await aesGcmDecrypt(ciphertext, key, nonce);
    
    return new Uint8Array(decryptedData);
  }

  /**
   * Generate TOTP secret using PQC random
   */
  static async generateMFASecret(): Promise<string> {
    const secretBytes = crypto.getRandomValues(new Uint8Array(32));
    return btoa(String.fromCharCode(...secretBytes)).replace(/=/g, '');
  }

  /**
   * Generate backup codes using PQC random
   */
  static async generateBackupCodes(count: number = 10): Promise<string[]> {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const codeBytes = crypto.getRandomValues(new Uint8Array(4));
      const code = Array.from(codeBytes)
        .map(b => b.toString(10).padStart(3, '0'))
        .join('')
        .substring(0, 8);
      codes.push(code.match(/.{4}/g)?.join('-') || '');
    }
    return codes;
  }
}
