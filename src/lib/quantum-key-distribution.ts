import { ensureSodiumReady } from './quantum-crypto';

export interface QKDChannel {
  id: string;
  participants: string[];
  keyMaterial: Uint8Array;
  errorRate: number;
  isAuthenticated: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface QKDProtocol {
  name: string;
  security_level: number;
  key_rate: number;
  max_distance: number;
}

export interface QKDSession {
  id: string;
  protocol: QKDProtocol;
  channel: QKDChannel;
  status: 'establishing' | 'active' | 'expired' | 'compromised';
  quantumBitErrorRate: number;
  extractedKeyLength: number;
}

/**
 * Quantum Key Distribution (QKD) simulator
 * Uses Web Crypto API - no libsodium dependency
 */
export class QuantumKeyDistribution {
  private static readonly QKD_PROTOCOLS: Record<string, QKDProtocol> = {
    'BB84': { name: 'BB84', security_level: 256, key_rate: 1000000, max_distance: 100 },
    'SARG04': { name: 'SARG04', security_level: 256, key_rate: 500000, max_distance: 150 },
    'COW': { name: 'Coherent One Way', security_level: 192, key_rate: 2000000, max_distance: 50 }
  };

  private static simulateQuantumChannel(
    photons: Uint8Array, distance: number, environmentalNoise: number = 0.01
  ): { receivedPhotons: Uint8Array; errorRate: number } {
    const lossRate = Math.min(0.2 * (distance / 100), 0.5);
    const qber = environmentalNoise + (distance * 0.001);
    const receivedPhotons = new Uint8Array(photons.length);
    const randomBytes = crypto.getRandomValues(new Uint8Array(photons.length * 2));
    let errors = 0;
    
    for (let i = 0; i < photons.length; i++) {
      if (randomBytes[i * 2] % 100 < (lossRate * 100)) {
        receivedPhotons[i] = 0;
        continue;
      }
      if (randomBytes[i * 2 + 1] % 1000 < (qber * 1000)) {
        receivedPhotons[i] = photons[i] ^ 1;
        errors++;
      } else {
        receivedPhotons[i] = photons[i];
      }
    }
    
    return { receivedPhotons, errorRate: errors / photons.length };
  }

  static async executeBB84Protocol(
    participantA: string, participantB: string, keyLength: number = 256, distance: number = 10
  ): Promise<QKDSession> {
    const protocol = this.QKD_PROTOCOLS['BB84'];
    const byteLen = keyLength / 8;
    
    const aliceBits = crypto.getRandomValues(new Uint8Array(byteLen));
    const aliceBases = crypto.getRandomValues(new Uint8Array(byteLen));
    
    const encodedPhotons = new Uint8Array(byteLen);
    for (let i = 0; i < encodedPhotons.length; i++) {
      encodedPhotons[i] = aliceBits[i] ^ aliceBases[i];
    }
    
    const { receivedPhotons, errorRate } = this.simulateQuantumChannel(encodedPhotons, distance);
    
    const bobBases = crypto.getRandomValues(new Uint8Array(byteLen));
    const bobBits = new Uint8Array(byteLen);
    for (let i = 0; i < bobBits.length; i++) {
      bobBits[i] = receivedPhotons[i] ^ bobBases[i];
    }
    
    const matchingBases: number[] = [];
    for (let i = 0; i < aliceBases.length; i++) {
      if (aliceBases[i] === bobBases[i]) matchingBases.push(i);
    }
    
    const extractedKeyLength = Math.floor(matchingBases.length * 0.5);
    const sharedKey = new Uint8Array(extractedKeyLength);
    for (let i = 0; i < extractedKeyLength; i++) {
      sharedKey[i] = aliceBits[matchingBases[i]];
    }
    
    const channelId = crypto.getRandomValues(new Uint8Array(16));
    const sessionId = crypto.getRandomValues(new Uint8Array(16));
    
    const channel: QKDChannel = {
      id: Array.from(channelId).map(b => b.toString(16).padStart(2, '0')).join(''),
      participants: [participantA, participantB],
      keyMaterial: sharedKey,
      errorRate,
      isAuthenticated: errorRate < 0.11,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000)
    };
    
    return {
      id: Array.from(sessionId).map(b => b.toString(16).padStart(2, '0')).join(''),
      protocol, channel,
      status: channel.isAuthenticated ? 'active' : 'compromised',
      quantumBitErrorRate: errorRate,
      extractedKeyLength: extractedKeyLength * 8
    };
  }

  static async privacyAmplification(rawKey: Uint8Array, errorRate: number): Promise<Uint8Array> {
    const leakageInformation = Math.ceil(rawKey.length * errorRate * 2);
    const secureKeyLength = Math.max(32, rawKey.length - leakageInformation);
    const rawBuf = rawKey.buffer.slice(rawKey.byteOffset, rawKey.byteOffset + rawKey.byteLength) as ArrayBuffer;
    const hashBuffer = await crypto.subtle.digest('SHA-256', rawBuf);
    const hash = new Uint8Array(hashBuffer);
    return hash.slice(0, secureKeyLength);
  }

  static detectEavesdropping(qber: number, threshold: number = 0.11): { detected: boolean; confidence: number; recommendation: string } {
    const detected = qber > threshold;
    const confidence = Math.min(qber / threshold, 1.0);
    let recommendation = 'Channel is secure for key distribution';
    if (detected) {
      if (qber > 0.25) recommendation = 'Severe eavesdropping detected. Abort key distribution immediately.';
      else if (qber > 0.15) recommendation = 'Possible eavesdropping. Consider increasing error correction.';
      else recommendation = 'Marginal eavesdropping detected. Monitor channel closely.';
    }
    return { detected, confidence, recommendation };
  }

  static async simulateCVQKD(participantA: string, participantB: string, keyLength: number = 256): Promise<QKDSession> {
    const protocol: QKDProtocol = { name: 'CV-QKD', security_level: 256, key_rate: 10000000, max_distance: 25 };
    const byteLen = keyLength / 8;
    const rawKey = crypto.getRandomValues(new Uint8Array(byteLen));
    
    const noisyKey = new Uint8Array(rawKey.length);
    for (let i = 0; i < rawKey.length; i++) {
      const noise = Math.random() * 0.1 - 0.05;
      noisyKey[i] = Math.max(0, Math.min(255, rawKey[i] + Math.floor(noise * 255)));
    }
    
    const errorRate = 0.05;
    const channelId = crypto.getRandomValues(new Uint8Array(16));
    const sessionId = crypto.getRandomValues(new Uint8Array(16));
    
    const channel: QKDChannel = {
      id: Array.from(channelId).map(b => b.toString(16).padStart(2, '0')).join(''),
      participants: [participantA, participantB],
      keyMaterial: await this.privacyAmplification(noisyKey, errorRate),
      errorRate, isAuthenticated: true,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1800000)
    };
    
    return {
      id: Array.from(sessionId).map(b => b.toString(16).padStart(2, '0')).join(''),
      protocol, channel, status: 'active',
      quantumBitErrorRate: errorRate,
      extractedKeyLength: channel.keyMaterial.length * 8
    };
  }
}
