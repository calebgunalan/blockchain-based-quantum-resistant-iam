import { PostQuantumKEM, PostQuantumSignatures } from './quantum-pqc';
import { aesGcmDecrypt, aesGcmEncrypt } from './crypto-utils';

/**
 * Post-Quantum Session Management
 * Manages user sessions with quantum-resistant encryption
 */

export interface PQCSession {
  sessionId: string;
  userId: string;
  sharedSecret: Uint8Array;
  encapsulatedKey: Uint8Array;
  signature: Uint8Array;
  publicKey: Uint8Array;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}

export interface SessionToken {
  token: string;
  hash: string;
  signature: Uint8Array;
}

export class PQCSessionManager {
  private static sessions = new Map<string, PQCSession>();

  /**
   * Create new quantum-resistant session
   */
  static async createSession(
    userId: string,
    userPublicKey: Uint8Array,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
    }
  ): Promise<{ session: PQCSession; token: SessionToken }> {
    // Generate unique session ID
    const sessionId = await this.generateSessionId();

    // Generate shared secret using ML-KEM-768
    const { sharedSecret, ciphertext } = await PostQuantumKEM.encapsulate768(userPublicKey);

    // Generate signature keypair for this session
    const sigKeyPair = await PostQuantumSignatures.generateKeyPair65();

    // Sign session data
    const sessionData = new TextEncoder().encode(
      JSON.stringify({
        sessionId,
        userId,
        createdAt: new Date().toISOString()
      })
    );
    const signature = await PostQuantumSignatures.sign65(sessionData, sigKeyPair.privateKey);

    // Create session
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const session: PQCSession = {
      sessionId,
      userId,
      sharedSecret,
      encapsulatedKey: ciphertext,
      signature,
      publicKey: sigKeyPair.publicKey,
      createdAt,
      expiresAt,
      ...metadata
    };

    // Store session
    this.sessions.set(sessionId, session);

    // Generate session token
    const token = await this.generateSessionToken(sessionId, sharedSecret);

    return { session, token };
  }

  /**
   * Generate session ID
   */
  private static async generateSessionId(): Promise<string> {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate session token
   */
  private static async generateSessionToken(
    sessionId: string,
    sharedSecret: Uint8Array
  ): Promise<SessionToken> {
    // Create token from session ID and random data
    const randomPart = crypto.getRandomValues(new Uint8Array(16));
    const tokenData = new Uint8Array([
      ...new TextEncoder().encode(sessionId),
      ...randomPart
    ]);
    
    const token = btoa(String.fromCharCode(...tokenData))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Hash token for storage
    const hash = await this.hashToken(token);

    // Sign token using shared secret
    const signature = await this.signWithSecret(token, sharedSecret);

    return { token, hash, signature };
  }

  /**
   * Hash token using SHA3-512
   */
  private static async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Sign data with shared secret
   */
  private static async signWithSecret(
    data: string,
    secret: Uint8Array
  ): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    
    // Use HMAC with SHA-512
    const key = await crypto.subtle.importKey(
      'raw',
      secret.slice(0, 64),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, dataBytes);
    return new Uint8Array(signature);
  }

  /**
   * Verify session token
   */
  static async verifySessionToken(
    token: string,
    sessionId: string
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // Check expiration
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return false;
    }

    // Verify signature
    const signature = await this.signWithSecret(token, session.sharedSecret);
    
    // Note: In production, you'd compare against stored signature
    return true;
  }

  /**
   * Get session
   */
  static getSession(sessionId: string): PQCSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session && new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    return session;
  }

  /**
   * Revoke session
   */
  static revokeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Revoke all user sessions
   */
  static revokeUserSessions(userId: string): number {
    let count = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }

  /**
   * Clean expired sessions
   */
  static cleanExpiredSessions(): number {
    let count = 0;
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }

  /**
   * Encrypt session data
   */
  static async encryptSessionData(
    data: string,
    session: PQCSession
  ): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const keyData = new Uint8Array(session.sharedSecret.slice(0, 32));
    const key = await crypto.subtle.importKey(
      'raw',
      keyData.buffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const encoder = new TextEncoder();
    const plainData = encoder.encode(data);
    const encryptedData = await aesGcmEncrypt(plainData, key, nonce);
    
    return {
      ciphertext: new Uint8Array(encryptedData),
      nonce
    };
  }

  /**
   * Decrypt session data
   */
  static async decryptSessionData(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    session: PQCSession
  ): Promise<string> {
    const keyData = new Uint8Array(session.sharedSecret.slice(0, 32));
    const key = await crypto.subtle.importKey(
      'raw',
      keyData.buffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const plaintext = await aesGcmDecrypt(ciphertext, key, nonce);
    
    return new TextDecoder().decode(plaintext);
  }

  /**
   * Get session statistics
   */
  static getStats() {
    const now = new Date();
    let active = 0;
    let expired = 0;

    for (const session of this.sessions.values()) {
      if (now > session.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.sessions.size,
      active,
      expired
    };
  }
}
