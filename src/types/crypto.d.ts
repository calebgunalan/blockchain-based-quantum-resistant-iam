// Type declarations to handle strict BufferSource checking
declare global {
  interface SubtleCrypto {
    decrypt(
      algorithm: AlgorithmIdentifier | RsaOaesParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource | Uint8Array
    ): Promise<ArrayBuffer>;
    
    encrypt(
      algorithm: AlgorithmIdentifier | RsaOaesParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource | Uint8Array
    ): Promise<ArrayBuffer>;
  }
}

export {};
