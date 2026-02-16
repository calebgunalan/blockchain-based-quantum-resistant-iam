/**
 * Hybrid Authentication Module
 * Implements dual-signature authentication combining:
 * 1. ECDSA P-256 (classical) via Web Crypto API
 * 2. ML-DSA-65 (post-quantum) via @noble/post-quantum
 * 
 * Both signatures MUST verify for authentication to succeed.
 * Provides defense-in-depth: if either algorithm is broken, the other still protects.
 */

import { PostQuantumSignatures } from './quantum-pqc';

export interface HybridKeyPair {
  classical: {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
    publicKeyRaw: Uint8Array;
  };
  postQuantum: {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
  };
}

export interface HybridSignatureBundle {
  classicalSignature: Uint8Array;
  pqSignature: Uint8Array;
  classicalPublicKey: Uint8Array;
  pqPublicKey: Uint8Array;
  algorithm: 'ECDSA-P256+ML-DSA-65';
  timestamp: string;
}

export interface HybridAuthChallenge {
  challengeId: string;
  nonce: Uint8Array;
  timestamp: string;
  expiresAt: string;
}

/**
 * Core Hybrid Authentication Engine
 */
export class HybridAuth {
  /**
   * Generate a hybrid key pair (ECDSA P-256 + ML-DSA-65)
   */
  static async generateKeyPair(): Promise<HybridKeyPair> {
    // Generate classical ECDSA P-256 key pair via Web Crypto
    const classicalKeys = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );

    // Export classical public key for storage
    const classicalPubRaw = await crypto.subtle.exportKey('raw', classicalKeys.publicKey);

    // Generate post-quantum ML-DSA-65 key pair
    const pqKeys = await PostQuantumSignatures.generateKeyPair65();

    return {
      classical: {
        publicKey: classicalKeys.publicKey,
        privateKey: classicalKeys.privateKey,
        publicKeyRaw: new Uint8Array(classicalPubRaw),
      },
      postQuantum: {
        publicKey: pqKeys.publicKey,
        privateKey: pqKeys.privateKey,
      },
    };
  }

  /**
   * Generate an authentication challenge
   */
  static generateChallenge(expiresInSeconds = 300): HybridAuthChallenge {
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000);

    return {
      challengeId: crypto.randomUUID(),
      nonce,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Sign a challenge with both classical and PQ keys
   */
  static async signChallenge(
    challenge: HybridAuthChallenge,
    classicalPrivateKey: CryptoKey,
    classicalPublicKey: CryptoKey,
    pqPrivateKey: Uint8Array,
    pqPublicKey: Uint8Array
  ): Promise<HybridSignatureBundle> {
    const encoder = new TextEncoder();
    const message = encoder.encode(
      JSON.stringify({
        challengeId: challenge.challengeId,
        nonce: Array.from(challenge.nonce),
        timestamp: challenge.timestamp,
      })
    );

    // Sign with both algorithms in parallel
    const [classicalSigBuffer, pqSig] = await Promise.all([
      crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        classicalPrivateKey,
        message
      ),
      PostQuantumSignatures.sign65(message, pqPrivateKey),
    ]);

    const classicalPubRaw = await crypto.subtle.exportKey('raw', classicalPublicKey);

    return {
      classicalSignature: new Uint8Array(classicalSigBuffer),
      pqSignature: pqSig,
      classicalPublicKey: new Uint8Array(classicalPubRaw),
      pqPublicKey,
      algorithm: 'ECDSA-P256+ML-DSA-65',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verify a hybrid signature bundle — BOTH must pass
   */
  static async verifySignatureBundle(
    challenge: HybridAuthChallenge,
    bundle: HybridSignatureBundle
  ): Promise<{ valid: boolean; classicalValid: boolean; pqValid: boolean }> {
    // Check challenge expiry
    if (new Date() > new Date(challenge.expiresAt)) {
      return { valid: false, classicalValid: false, pqValid: false };
    }

    const encoder = new TextEncoder();
    const message = encoder.encode(
      JSON.stringify({
        challengeId: challenge.challengeId,
        nonce: Array.from(challenge.nonce),
        timestamp: challenge.timestamp,
      })
    );

    // Import classical public key
    const classicalPub = await crypto.subtle.importKey(
      'raw',
      bundle.classicalPublicKey.buffer.slice(
        bundle.classicalPublicKey.byteOffset,
        bundle.classicalPublicKey.byteOffset + bundle.classicalPublicKey.byteLength
      ) as ArrayBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );

    // Verify both in parallel
    const [classicalValid, pqValid] = await Promise.all([
      crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        classicalPub,
        bundle.classicalSignature.buffer.slice(
          bundle.classicalSignature.byteOffset,
          bundle.classicalSignature.byteOffset + bundle.classicalSignature.byteLength
        ) as ArrayBuffer,
        message
      ),
      PostQuantumSignatures.verify65(bundle.pqSignature, message, bundle.pqPublicKey),
    ]);

    return {
      valid: classicalValid && pqValid,
      classicalValid,
      pqValid,
    };
  }

  /**
   * Serialize a hybrid key pair for secure storage
   */
  static async serializeKeyPair(keyPair: HybridKeyPair): Promise<string> {
    const classicalPrivJwk = await crypto.subtle.exportKey('jwk', keyPair.classical.privateKey);
    const classicalPubJwk = await crypto.subtle.exportKey('jwk', keyPair.classical.publicKey);

    return JSON.stringify({
      type: 'HybridKeyPair',
      algorithm: 'ECDSA-P256+ML-DSA-65',
      classical: {
        privateKey: classicalPrivJwk,
        publicKey: classicalPubJwk,
      },
      postQuantum: {
        publicKey: btoa(String.fromCharCode(...keyPair.postQuantum.publicKey)),
        privateKey: btoa(String.fromCharCode(...keyPair.postQuantum.privateKey)),
      },
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Deserialize a hybrid key pair
   */
  static async deserializeKeyPair(serialized: string): Promise<HybridKeyPair> {
    const data = JSON.parse(serialized);

    const classicalPriv = await crypto.subtle.importKey(
      'jwk', data.classical.privateKey,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true, ['sign']
    );
    const classicalPub = await crypto.subtle.importKey(
      'jwk', data.classical.publicKey,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true, ['verify']
    );
    const classicalPubRaw = await crypto.subtle.exportKey('raw', classicalPub);

    const pqPub = Uint8Array.from(atob(data.postQuantum.publicKey), c => c.charCodeAt(0));
    const pqPriv = Uint8Array.from(atob(data.postQuantum.privateKey), c => c.charCodeAt(0));

    return {
      classical: { publicKey: classicalPub, privateKey: classicalPriv, publicKeyRaw: new Uint8Array(classicalPubRaw) },
      postQuantum: { publicKey: pqPub, privateKey: pqPriv },
    };
  }
}
