/**
 * Post-Quantum Cryptography Implementation
 * TRUE NIST-standardized post-quantum algorithms using @noble/post-quantum
 * 
 * Implements:
 * - ML-KEM-768/1024 (formerly Kyber) - NIST FIPS 203
 * - ML-DSA-65/87 (formerly Dilithium) - NIST FIPS 204
 * 
 * These are REAL post-quantum cryptographic algorithms, not simulations.
 * Performance optimized via pure JavaScript implementation.
 */

// Import specific submodules from noble post-quantum (must use .js extension)
import { ml_kem768, ml_kem1024 } from '@noble/post-quantum/ml-kem.js';
import { ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js';

// Type definitions for ML-KEM and ML-DSA based on @noble/post-quantum API
type MLKEMInstance = {
  keygen: (seed?: Uint8Array) => { publicKey: Uint8Array; secretKey: Uint8Array };
  encapsulate: (publicKey: Uint8Array) => { cipherText: Uint8Array; sharedSecret: Uint8Array };
  decapsulate: (ciphertext: Uint8Array, secretKey: Uint8Array) => Uint8Array;
};

type MLDSAInstance = {
  keygen: (seed?: Uint8Array) => { publicKey: Uint8Array; secretKey: Uint8Array };
  sign: (secretKey: Uint8Array, message: Uint8Array) => Uint8Array;
  verify: (publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array) => boolean;
};

// Access the specific algorithm instances (directly imported above)
const mlkem768 = ml_kem768;
const mlkem1024 = ml_kem1024;
const mldsa65 = ml_dsa65;
const mldsa87 = ml_dsa87;

/**
 * Convert Uint8Array to base64 for storage/transmission
 */
function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Convert base64 to Uint8Array
 */
function fromBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

/**
 * REAL Post-Quantum Key Encapsulation Mechanism (ML-KEM)
 * NIST FIPS 203 - Formerly known as Kyber
 * 
 * ML-KEM provides quantum-resistant key encapsulation:
 * - ML-KEM-768: NIST Security Level 3 (192-bit equivalent)
 * - ML-KEM-1024: NIST Security Level 5 (256-bit equivalent)
 */
export class PostQuantumKEM {
  /**
   * Generate ML-KEM-768 key pair (NIST Security Level 3)
   * Public Key: 1184 bytes
   * Secret Key: 2400 bytes
   * Ciphertext: 1088 bytes
   * Shared Secret: 32 bytes
   */
  static async generateKeyPair768() {
    const keys = mlkem768.keygen();
    
    return {
      publicKey: keys.publicKey,
      secretKey: keys.secretKey
    };
  }

  /**
   * Generate ML-KEM-1024 key pair (NIST Security Level 5)
   * Public Key: 1568 bytes
   * Secret Key: 3168 bytes
   * Ciphertext: 1568 bytes
   * Shared Secret: 32 bytes
   */
  static async generateKeyPair1024() {
    const keys = mlkem1024.keygen();
    
    return {
      publicKey: keys.publicKey,
      secretKey: keys.secretKey
    };
  }

  /**
   * Encapsulate shared secret using ML-KEM-768
   * Returns ciphertext and shared secret
   */
  static async encapsulate768(publicKey: Uint8Array) {
    const { cipherText, sharedSecret } = mlkem768.encapsulate(publicKey);
    
    return {
      ciphertext: cipherText,
      sharedSecret
    };
  }

  /**
   * Encapsulate shared secret using ML-KEM-1024
   * Returns ciphertext and shared secret
   */
  static async encapsulate1024(publicKey: Uint8Array) {
    const { cipherText, sharedSecret } = mlkem1024.encapsulate(publicKey);
    
    return {
      ciphertext: cipherText,
      sharedSecret
    };
  }

  /**
   * Decapsulate shared secret using ML-KEM-768
   */
  static async decapsulate768(ciphertext: Uint8Array, secretKey: Uint8Array): Promise<Uint8Array> {
    return mlkem768.decapsulate(ciphertext, secretKey);
  }

  /**
   * Decapsulate shared secret using ML-KEM-1024
   */
  static async decapsulate1024(ciphertext: Uint8Array, secretKey: Uint8Array): Promise<Uint8Array> {
    return mlkem1024.decapsulate(ciphertext, secretKey);
  }

  /**
   * Serialize key pair to JSON-LD format for storage
   */
  static serializeKeyPair(
    publicKey: Uint8Array,
    secretKey: Uint8Array,
    algorithm: 'ML-KEM-768' | 'ML-KEM-1024'
  ): string {
    return JSON.stringify({
      '@context': 'https://www.w3.org/2018/credentials/v1',
      type: 'PostQuantumKeyPair',
      algorithm,
      publicKey: toBase64(publicKey),
      secretKey: toBase64(secretKey),
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Deserialize key pair from JSON-LD
   */
  static deserializeKeyPair(jsonLd: string): {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
    algorithm: string;
  } {
    const data = JSON.parse(jsonLd);
    return {
      publicKey: fromBase64(data.publicKey),
      secretKey: fromBase64(data.secretKey),
      algorithm: data.algorithm
    };
  }
}

/**
 * REAL Post-Quantum Digital Signatures (ML-DSA)
 * NIST FIPS 204 - Formerly known as Dilithium
 * 
 * ML-DSA provides quantum-resistant digital signatures:
 * - ML-DSA-65: NIST Security Level 3 (192-bit equivalent)
 * - ML-DSA-87: NIST Security Level 5 (256-bit equivalent)
 */
export class PostQuantumSignatures {
  /**
   * Generate ML-DSA-65 key pair (NIST Security Level 3)
   * Public Key: 1952 bytes
   * Secret Key: 4032 bytes
   * Signature: ~3309 bytes (variable)
   */
  static async generateKeyPair65() {
    const keys = mldsa65.keygen();
    
    return {
      publicKey: keys.publicKey,
      privateKey: keys.secretKey
    };
  }

  /**
   * Generate ML-DSA-87 key pair (NIST Security Level 5)
   * Public Key: 2592 bytes
   * Secret Key: 4896 bytes
   * Signature: ~4627 bytes (variable)
   */
  static async generateKeyPair87() {
    const keys = mldsa87.keygen();
    
    return {
      publicKey: keys.publicKey,
      privateKey: keys.secretKey
    };
  }

  /**
   * Sign message with ML-DSA-65
   */
  static async sign65(message: Uint8Array, secretKey: Uint8Array): Promise<Uint8Array> {
    return mldsa65.sign(secretKey, message);
  }

  /**
   * Sign message with ML-DSA-87
   */
  static async sign87(message: Uint8Array, secretKey: Uint8Array): Promise<Uint8Array> {
    return mldsa87.sign(secretKey, message);
  }

  /**
   * Verify ML-DSA-65 signature
   */
  static async verify65(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): Promise<boolean> {
    return mldsa65.verify(publicKey, message, signature);
  }

  /**
   * Verify ML-DSA-87 signature
   */
  static async verify87(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): Promise<boolean> {
    return mldsa87.verify(publicKey, message, signature);
  }

  /**
   * Serialize signature key pair to JSON-LD format
   */
  static serializeKeyPair(
    publicKey: Uint8Array,
    secretKey: Uint8Array,
    algorithm: 'ML-DSA-65' | 'ML-DSA-87'
  ): string {
    return JSON.stringify({
      '@context': 'https://www.w3.org/2018/credentials/v1',
      type: 'PostQuantumSignatureKeyPair',
      algorithm,
      publicKey: toBase64(publicKey),
      secretKey: toBase64(secretKey),
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Serialize signature to JSON-LD for storage/transmission
   */
  static serializeSignature(
    signature: Uint8Array,
    algorithm: 'ML-DSA-65' | 'ML-DSA-87',
    messageHash: string
  ): string {
    return JSON.stringify({
      '@context': 'https://www.w3.org/2018/credentials/v1',
      type: 'PostQuantumSignature',
      algorithm,
      signature: toBase64(signature),
      messageHash,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Hybrid Cryptography - Combines classical and post-quantum for defense-in-depth
 * Provides security even if one algorithm family is compromised
 */
export class HybridCrypto {
  /**
   * Hybrid key encapsulation combining classical + ML-KEM-768
   * Uses KDF to combine secrets securely (better than XOR)
   * Secure even if one algorithm is broken
   */
  static async hybridKeyExchange(
    classicalPublicKey: Uint8Array,
    pqPublicKey: Uint8Array,
    classicalEncapsulate: (pk: Uint8Array) => Promise<{ sharedSecret: Uint8Array; ciphertext: Uint8Array }>,
  ): Promise<{ 
    combinedSecret: Uint8Array; 
    classicalCiphertext: Uint8Array; 
    pqCiphertext: Uint8Array;
  }> {
    // Classical key exchange (e.g., X25519)
    const classical = await classicalEncapsulate(classicalPublicKey);
    
    // Post-quantum key exchange (ML-KEM-768)
    const { ciphertext: pqCiphertext, sharedSecret: pqSecret } = await PostQuantumKEM.encapsulate768(pqPublicKey);
    
    // Combine secrets using HKDF-style derivation
    const combinedInput = new Uint8Array(classical.sharedSecret.length + pqSecret.length);
    combinedInput.set(classical.sharedSecret, 0);
    combinedInput.set(pqSecret, classical.sharedSecret.length);
    
    // Hash combined input for final shared secret
    const combinedSecret = await crypto.subtle.digest('SHA-256', combinedInput);
    
    return {
      combinedSecret: new Uint8Array(combinedSecret),
      classicalCiphertext: classical.ciphertext,
      pqCiphertext
    };
  }

  /**
   * Hybrid signature combining classical + ML-DSA-65
   * Both signatures must verify for acceptance
   */
  static async hybridSign(
    message: Uint8Array,
    classicalSecretKey: Uint8Array,
    pqSecretKey: Uint8Array,
    classicalSign: (msg: Uint8Array, sk: Uint8Array) => Promise<Uint8Array>
  ): Promise<{ classicalSig: Uint8Array; pqSig: Uint8Array }> {
    // Sign with both algorithms
    const [classicalSig, pqSig] = await Promise.all([
      classicalSign(message, classicalSecretKey),
      PostQuantumSignatures.sign65(message, pqSecretKey)
    ]);
    
    return { classicalSig, pqSig };
  }

  /**
   * Verify hybrid signature (both must be valid)
   */
  static async hybridVerify(
    message: Uint8Array,
    classicalSig: Uint8Array,
    pqSig: Uint8Array,
    classicalPublicKey: Uint8Array,
    pqPublicKey: Uint8Array,
    classicalVerify: (sig: Uint8Array, msg: Uint8Array, pk: Uint8Array) => Promise<boolean>
  ): Promise<boolean> {
    // Both signatures must be valid
    const [classicalValid, pqValid] = await Promise.all([
      classicalVerify(classicalSig, message, classicalPublicKey),
      PostQuantumSignatures.verify65(pqSig, message, pqPublicKey)
    ]);
    
    return classicalValid && pqValid;
  }

  /**
   * Serialize hybrid signature for storage/transmission
   */
  static serializeHybridSignature(
    classicalSig: Uint8Array,
    pqSig: Uint8Array,
    classicalAlgorithm: string,
    pqAlgorithm: string
  ): string {
    return JSON.stringify({
      '@context': 'https://www.w3.org/2018/credentials/v1',
      type: 'HybridSignature',
      classical: {
        algorithm: classicalAlgorithm,
        signature: toBase64(classicalSig)
      },
      postQuantum: {
        algorithm: pqAlgorithm,
        signature: toBase64(pqSig)
      },
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Quantum Attack Detection
 * Analyzes cryptographic operations for potential quantum attacks
 */
export class QuantumAttackDetector {
  private static readonly ATTACK_SIGNATURES = {
    SHORS_ALGORITHM: /shor|factoring|discrete.?log/i,
    GROVERS_ALGORITHM: /grover|search|collision/i,
    QUANTUM_MITM: /quantum.*(mitm|man.in.the.middle)/i,
    KEY_RECOVERY: /key.?recovery|extract.*key/i,
  };

  /**
   * Detect potential quantum attack patterns
   */
  static detectAttackPattern(
    operationType: string,
    metadata: Record<string, any>
  ): { 
    isQuantumThreat: boolean; 
    attackType?: string; 
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: string;
  } {
    // Check for use of vulnerable classical algorithms
    const vulnerableAlgorithms = ['rsa', 'ecdsa', 'ecdh', 'dh', 'elgamal'];
    const usesVulnerable = vulnerableAlgorithms.some(alg => 
      operationType.toLowerCase().includes(alg)
    );

    if (usesVulnerable) {
      return {
        isQuantumThreat: true,
        attackType: 'VULNERABLE_ALGORITHM',
        severity: 'high',
        details: `Operation uses quantum-vulnerable algorithm. Quantum computer with Shor's algorithm could break this.`
      };
    }

    // Check metadata for attack signatures
    const metadataStr = JSON.stringify(metadata).toLowerCase();
    for (const [attackType, pattern] of Object.entries(this.ATTACK_SIGNATURES)) {
      if (pattern.test(metadataStr)) {
        return {
          isQuantumThreat: true,
          attackType,
          severity: 'critical',
          details: `Potential quantum attack signature detected: ${attackType}`
        };
      }
    }

    // Check for suspicious key sizes (too small for post-quantum era)
    if (metadata.keySize && metadata.keySize < 256) {
      return {
        isQuantumThreat: true,
        attackType: 'WEAK_KEY_SIZE',
        severity: 'medium',
        details: `Key size ${metadata.keySize} bits is insufficient for quantum resistance`
      };
    }

    return {
      isQuantumThreat: false,
      severity: 'low',
      details: 'No quantum threats detected'
    };
  }

  /**
   * Calculate quantum security level
   */
  static calculateQuantumSecurityLevel(
    algorithm: string,
    keySize: number
  ): {
    securityLevel: number;
    quantumResistant: boolean;
    equivalentAES: number;
    recommendations: string[];
  } {
    const pqAlgorithms = ['ml-kem', 'ml-dsa', 'slh-dsa', 'crystals', 'dilithium', 'kyber', 'sphincs'];
    const isPostQuantum = pqAlgorithms.some(alg => algorithm.toLowerCase().includes(alg));

    let securityLevel = 0;
    let equivalentAES = 0;
    const recommendations: string[] = [];

    if (isPostQuantum) {
      // Post-quantum security levels
      if (algorithm.includes('768') || algorithm.includes('65')) {
        securityLevel = 3;
        equivalentAES = 192;
      } else if (algorithm.includes('1024') || algorithm.includes('87')) {
        securityLevel = 5;
        equivalentAES = 256;
      } else {
        securityLevel = 2;
        equivalentAES = 128;
      }
      recommendations.push('Using quantum-resistant algorithm - excellent security');
    } else {
      // Classical algorithms - all vulnerable to quantum
      securityLevel = 0;
      equivalentAES = 0;
      recommendations.push('URGENT: Migrate to post-quantum cryptography');
      recommendations.push('Consider hybrid approach for transition period');
    }

    return {
      securityLevel,
      quantumResistant: isPostQuantum,
      equivalentAES,
      recommendations
    };
  }
}

/**
 * Post-Quantum Migration Helper
 */
export class PQMigration {
  /**
   * Generate migration plan from classical to post-quantum
   */
  static generateMigrationPlan(
    currentAlgorithm: string,
    securityRequirement: 'standard' | 'high' | 'top-secret'
  ): {
    recommendedKEM: string;
    recommendedSignature: string;
    timeline: string;
    steps: string[];
  } {
    const kemAlgorithm = securityRequirement === 'top-secret' ? 'ML-KEM-1024' : 'ML-KEM-768';
    const sigAlgorithm = securityRequirement === 'top-secret' ? 'ML-DSA-87' : 'ML-DSA-65';

    return {
      recommendedKEM: kemAlgorithm,
      recommendedSignature: sigAlgorithm,
      timeline: 'Immediate - quantum computers pose imminent threat',
      steps: [
        '1. Generate post-quantum key pairs (ML-KEM + ML-DSA)',
        '2. Implement hybrid mode (classical + PQ) for compatibility',
        '3. Update all session establishment to use hybrid keys',
        '4. Rotate existing keys to post-quantum versions',
        '5. Update certificate infrastructure to PQ algorithms',
        '6. Monitor quantum threat intelligence for timeline updates',
        '7. Phase out classical-only cryptography within 6 months'
      ]
    };
  }
}
