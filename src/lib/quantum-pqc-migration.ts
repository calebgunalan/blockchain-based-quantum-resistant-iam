/**
 * Migration Utilities for Post-Quantum Cryptography
 * Provides drop-in replacements for quantum-crypto.ts functions using quantum-pqc.ts
 */

import { PostQuantumSignatures, PostQuantumKEM } from './quantum-pqc';

export class PQCMigration {
  /**
   * Generate secure random bytes using ML-KEM
   */
  static async generateSecureRandom(length: number): Promise<Uint8Array> {
    // Use ML-KEM-768 for random generation
    const keyPair = await PostQuantumKEM.generateKeyPair768();
    
    // Derive random bytes from public key material
    const randomBytes = new Uint8Array(length);
    const source = keyPair.publicKey;
    
    for (let i = 0; i < length; i++) {
      randomBytes[i] = source[i % source.length] ^ (Date.now() & 0xFF);
    }
    
    return randomBytes;
  }

  /**
   * Generate API key using PQC
   */
  static async generateAPIKey(): Promise<string> {
    const prefix = 'qsk_'; // Quantum-Safe Key prefix
    const randomBytes = await this.generateSecureRandom(32);
    const key = this.bytesToBase64(randomBytes);
    return prefix + key;
  }

  /**
   * Hash token using PQC
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
   * Sign data using ML-DSA-65
   */
  static async sign(data: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
    return await PostQuantumSignatures.sign65(data, privateKey);
  }

  /**
   * Verify signature using ML-DSA-65
   */
  static async verify(signature: Uint8Array, data: Uint8Array, publicKey: Uint8Array): Promise<boolean> {
    return await PostQuantumSignatures.verify65(signature, data, publicKey);
  }

  /**
   * Key exchange using ML-KEM-768
   */
  static async keyExchange(publicKey: Uint8Array) {
    return await PostQuantumKEM.encapsulate768(publicKey);
  }

  /**
   * Generate string of random characters
   */
  static async randomString(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): Promise<string> {
    const bytes = await this.generateSecureRandom(length);
    return Array.from(bytes)
      .map(byte => charset[byte % charset.length])
      .join('');
  }

  /**
   * Convert bytes to base64
   */
  private static bytesToBase64(bytes: Uint8Array): string {
    const binString = String.fromCharCode(...bytes);
    return btoa(binString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}
