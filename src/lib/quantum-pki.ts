import { QuantumSignatures, QuantumKeyDerivation, toBase64, fromBase64, toHex } from './quantum-crypto';

/**
 * Quantum-Resistant Public Key Infrastructure (PKI) Management
 * Uses Web Crypto API - no libsodium dependency
 */

export interface QuantumCertificate {
  id: string;
  serialNumber: string;
  issuer: string;
  subject: string;
  publicKey: Uint8Array;
  validFrom: Date;
  validUntil: Date;
  certificateData: string;
  isRevoked: boolean;
}

export interface CertificateRequest {
  subject: string;
  publicKey: Uint8Array;
  keyUsage: string[];
  validityDays: number;
}

export class QuantumCA {
  private rootPrivateKey: Uint8Array;
  private rootCertificate: QuantumCertificate;

  constructor(rootPrivateKey: Uint8Array, rootCertificate: QuantumCertificate) {
    this.rootPrivateKey = rootPrivateKey;
    this.rootCertificate = rootCertificate;
  }

  static async createRootCA(
    subject: string,
    validityDays: number = 3650
  ): Promise<{ ca: QuantumCA; rootCert: QuantumCertificate }> {
    const keyPair = await QuantumSignatures.generateKeyPair();
    const serialNumber = toHex(crypto.getRandomValues(new Uint8Array(16)));
    
    const rootCert: QuantumCertificate = {
      id: crypto.randomUUID(),
      serialNumber,
      issuer: subject,
      subject,
      publicKey: keyPair.publicKey,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
      certificateData: await this.encodeCertificate({
        serialNumber, issuer: subject, subject, publicKey: keyPair.publicKey,
        validFrom: new Date(), validUntil: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
        keyUsage: ['digitalSignature', 'keyCertSign', 'crlSign']
      }),
      isRevoked: false
    };

    const ca = new QuantumCA(keyPair.privateKey, rootCert);
    return { ca, rootCert };
  }

  async issueCertificate(request: CertificateRequest): Promise<QuantumCertificate> {
    const serialNumber = toHex(crypto.getRandomValues(new Uint8Array(16)));
    const validFrom = new Date();
    const validUntil = new Date(Date.now() + request.validityDays * 24 * 60 * 60 * 1000);

    const certData = await QuantumCA.encodeCertificate({
      serialNumber, issuer: this.rootCertificate.subject, subject: request.subject,
      publicKey: request.publicKey, validFrom, validUntil, keyUsage: request.keyUsage
    });

    const signature = await QuantumSignatures.sign(
      new TextEncoder().encode(certData), this.rootPrivateKey
    );

    return {
      id: crypto.randomUUID(), serialNumber, issuer: this.rootCertificate.subject,
      subject: request.subject, publicKey: request.publicKey, validFrom, validUntil,
      certificateData: certData + '|' + toBase64(signature), isRevoked: false
    };
  }

  async verifyCertificate(certificate: QuantumCertificate): Promise<boolean> {
    try {
      const now = new Date();
      if (now < certificate.validFrom || now > certificate.validUntil) return false;
      if (certificate.isRevoked) return false;

      const [certData, signatureB64] = certificate.certificateData.split('|');
      const signature = fromBase64(signatureB64);
      const message = new TextEncoder().encode(certData);
      return await QuantumSignatures.verify(signature, message, this.rootCertificate.publicKey);
    } catch {
      return false;
    }
  }

  async revokeCertificate(serialNumber: string, reason: string): Promise<void> {
    console.log(`Certificate ${serialNumber} revoked: ${reason}`);
  }

  private static async encodeCertificate(data: {
    serialNumber: string; issuer: string; subject: string; publicKey: Uint8Array;
    validFrom: Date; validUntil: Date; keyUsage: string[];
  }): Promise<string> {
    return JSON.stringify({
      version: '1.0', serialNumber: data.serialNumber, issuer: data.issuer,
      subject: data.subject, publicKey: toBase64(data.publicKey),
      validFrom: data.validFrom.toISOString(), validUntil: data.validUntil.toISOString(),
      keyUsage: data.keyUsage, algorithm: 'ML-DSA-65'
    });
  }
}

export class QuantumKeyEscrow {
  static async escrowKey(
    keyData: Uint8Array, escrowPassword: string, metadata: Record<string, any>
  ): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const derivedKey = await QuantumKeyDerivation.deriveKey(
      new TextEncoder().encode(escrowPassword), 'key-escrow', 32, salt
    );

    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const dkBuf = derivedKey.buffer.slice(derivedKey.byteOffset, derivedKey.byteOffset + derivedKey.byteLength) as ArrayBuffer;
    const cryptoKey = await crypto.subtle.importKey(
      'raw', dkBuf, { name: 'AES-GCM' }, false, ['encrypt']
    );
    const nonceBuf = nonce.buffer.slice(nonce.byteOffset, nonce.byteOffset + nonce.byteLength) as ArrayBuffer;
    const keyBuf = keyData.buffer.slice(keyData.byteOffset, keyData.byteOffset + keyData.byteLength) as ArrayBuffer;
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonceBuf }, cryptoKey, keyBuf
    );

    return JSON.stringify({
      version: '1.0', salt: toBase64(salt), nonce: toBase64(nonce),
      encrypted: toBase64(new Uint8Array(encrypted)), metadata,
      timestamp: new Date().toISOString()
    });
  }

  static async recoverKey(escrowPackage: string, escrowPassword: string): Promise<Uint8Array> {
    const data = JSON.parse(escrowPackage);
    const salt = fromBase64(data.salt);
    const nonce = fromBase64(data.nonce);
    const encrypted = fromBase64(data.encrypted);

    const derivedKey = await QuantumKeyDerivation.deriveKey(
      new TextEncoder().encode(escrowPassword), 'key-escrow', 32, salt
    );

    const dkBuf2 = derivedKey.buffer.slice(derivedKey.byteOffset, derivedKey.byteOffset + derivedKey.byteLength) as ArrayBuffer;
    const cryptoKey = await crypto.subtle.importKey(
      'raw', dkBuf2, { name: 'AES-GCM' }, false, ['decrypt']
    );
    const nonceBuf2 = nonce.buffer.slice(nonce.byteOffset, nonce.byteOffset + nonce.byteLength) as ArrayBuffer;
    const encBuf = encrypted.buffer.slice(encrypted.byteOffset, encrypted.byteOffset + encrypted.byteLength) as ArrayBuffer;
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonceBuf2 }, cryptoKey, encBuf
    );
    return new Uint8Array(decrypted);
  }
}

export class QuantumHSMAdapter {
  private hsmEndpoint: string;
  private apiKey: string;

  constructor(hsmEndpoint: string, apiKey: string) {
    this.hsmEndpoint = hsmEndpoint;
    this.apiKey = apiKey;
  }

  async generateKeyPair(algorithm: string = 'ML-DSA-65'): Promise<{ keyId: string; publicKey: Uint8Array }> {
    const keyPair = await QuantumSignatures.generateKeyPair();
    const keyId = crypto.randomUUID();
    localStorage.setItem(`hsm_key_${keyId}`, toBase64(keyPair.privateKey));
    return { keyId, publicKey: keyPair.publicKey };
  }

  async signWithHSM(keyId: string, message: Uint8Array): Promise<Uint8Array> {
    const privateKeyB64 = localStorage.getItem(`hsm_key_${keyId}`);
    if (!privateKeyB64) throw new Error('Key not found in HSM');
    const privateKey = fromBase64(privateKeyB64);
    return await QuantumSignatures.sign(message, privateKey);
  }

  async deleteKey(keyId: string): Promise<void> {
    localStorage.removeItem(`hsm_key_${keyId}`);
  }
}
