import { PostQuantumSignatures, PostQuantumKEM } from './quantum-pqc';

/**
 * Decentralized Identifier (DID) Format
 * did:quantum:fabric:address
 */

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface QuantumDID {
  '@context': string[];
  id: string;
  publicKey: {
    id: string;
    type: string;
    controller: string;
    publicKeyHex: string;
  }[];
  authentication: string[];
  service: ServiceEndpoint[];
  created: string;
  updated: string;
}

/**
 * DID Manager for Quantum-Resistant Decentralized Identity
 */
export class DIDManager {
  private static readonly DID_METHOD = 'quantum';
  private static readonly DID_NETWORK = 'fabric';

  /**
   * Create a new DID for a user
   */
  static async createDID(identifier: string): Promise<QuantumDID> {
    // Generate quantum-resistant keys using ML-DSA-65 and ML-KEM-768
    const signatureKeyPair = await PostQuantumSignatures.generateKeyPair65();
    const kemKeyPair = await PostQuantumKEM.generateKeyPair768();

    // Generate unique DID address
    const address = await this.generateDIDAddress(identifier);
    const didId = `did:${this.DID_METHOD}:${this.DID_NETWORK}:${address}`;

    const did: QuantumDID = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
        'https://quantum-iam.org/quantum-security/v1'
      ],
      id: didId,
      publicKey: [
        {
          id: `${didId}#keys-1`,
          type: 'ML-DSA-65-2024',
          controller: didId,
          publicKeyHex: Array.from(signatureKeyPair.publicKey)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        },
        {
          id: `${didId}#keys-2`,
          type: 'ML-KEM-768-2024',
          controller: didId,
          publicKeyHex: Array.from(kemKeyPair.publicKey)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        }
      ],
      authentication: [`${didId}#keys-1`],
      service: [
        {
          id: `${didId}#iam-service`,
          type: 'QuantumIAMService',
          serviceEndpoint: `https://quantum-iam.app/did/${address}`
        }
      ],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    return did;
  }

  /**
   * Resolve a DID to its document
   */
  static async resolveDID(did: string): Promise<QuantumDID | null> {
    try {
      // In production, this would query the blockchain
      // For now, we'll implement a basic resolver
      const parts = did.split(':');
      if (parts.length !== 4 || parts[0] !== 'did' || parts[1] !== this.DID_METHOD) {
        return null;
      }

      // Query blockchain or distributed storage for DID document
      // This is a placeholder - actual implementation would connect to Hyperledger Fabric
      return null;
    } catch (error) {
      console.error('Error resolving DID:', error);
      return null;
    }
  }

  /**
   * Update a DID document
   */
  static async updateDID(
    did: QuantumDID,
    updates: Partial<Omit<QuantumDID, 'id' | '@context' | 'created'>>
  ): Promise<QuantumDID> {
    const updatedDID: QuantumDID = {
      ...did,
      ...updates,
      updated: new Date().toISOString()
    };

    // In production, this would update the blockchain
    return updatedDID;
  }

  /**
   * Verify DID ownership using ML-DSA-65
   */
  static async verifyDIDOwnership(
    did: string,
    challenge: string,
    signature: Uint8Array
  ): Promise<boolean> {
    try {
      const didDocument = await this.resolveDID(did);
      if (!didDocument) {
        return false;
      }

      // Get the authentication key
      const authKeyId = didDocument.authentication[0];
      const authKey = didDocument.publicKey.find(pk => pk.id === authKeyId);
      if (!authKey) {
        return false;
      }

      // Verify signature using ML-DSA-65
      const publicKey = new Uint8Array(
        authKey.publicKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );
      const challengeBytes = new TextEncoder().encode(challenge);

      return await PostQuantumSignatures.verify65(signature, challengeBytes, publicKey);
    } catch (error) {
      console.error('Error verifying DID ownership:', error);
      return false;
    }
  }

  /**
   * Add a service endpoint to DID
   */
  static async addServiceEndpoint(
    did: QuantumDID,
    service: ServiceEndpoint
  ): Promise<QuantumDID> {
    const updatedDID = {
      ...did,
      service: [...did.service, service],
      updated: new Date().toISOString()
    };

    // In production, update on blockchain
    return updatedDID;
  }

  /**
   * Rotate DID keys
   */
  static async rotateDIDKeys(did: QuantumDID): Promise<QuantumDID> {
    // Generate new keys using ML-DSA-65 and ML-KEM-768
    const newSignatureKeyPair = await PostQuantumSignatures.generateKeyPair65();
    const newKemKeyPair = await PostQuantumKEM.generateKeyPair768();

    // Keep old keys for a transition period, mark as revoked
    const oldKeys = did.publicKey.map(pk => ({
      ...pk,
      revoked: new Date().toISOString()
    }));

    // Add new keys
    const newKeys = [
      {
        id: `${did.id}#keys-${Date.now()}-1`,
        type: 'ML-DSA-65-2024',
        controller: did.id,
        publicKeyHex: Array.from(newSignatureKeyPair.publicKey)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      },
      {
        id: `${did.id}#keys-${Date.now()}-2`,
        type: 'ML-KEM-768-2024',
        controller: did.id,
        publicKeyHex: Array.from(newKemKeyPair.publicKey)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      }
    ];

    const updatedDID: QuantumDID = {
      ...did,
      publicKey: [...newKeys, ...oldKeys],
      authentication: [newKeys[0].id],
      updated: new Date().toISOString()
    };

    // In production, update on blockchain
    return updatedDID;
  }

  /**
   * Generate unique DID address
   */
  private static async generateDIDAddress(identifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(identifier + Date.now());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return hash.substring(0, 40);
  }

  /**
   * Create DID proof using ML-DSA-65
   */
  static async createDIDProof(
    did: string,
    privateKey: Uint8Array,
    challenge: string
  ): Promise<{ proof: string; proofPurpose: string; created: string }> {
    const challengeBytes = new TextEncoder().encode(challenge);
    const signature = await PostQuantumSignatures.sign65(challengeBytes, privateKey);

    return {
      proof: Array.from(signature)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
      proofPurpose: 'authentication',
      created: new Date().toISOString()
    };
  }

  /**
   * Export DID document as JSON-LD
   */
  static exportDIDDocument(did: QuantumDID): string {
    return JSON.stringify(did, null, 2);
  }

  /**
   * Import DID document from JSON-LD
   */
  static importDIDDocument(jsonLD: string): QuantumDID | null {
    try {
      const did = JSON.parse(jsonLD) as QuantumDID;
      
      // Validate DID structure
      if (!did.id || !did.publicKey || !did.authentication) {
        return null;
      }

      return did;
    } catch (error) {
      console.error('Error importing DID document:', error);
      return null;
    }
  }
}
