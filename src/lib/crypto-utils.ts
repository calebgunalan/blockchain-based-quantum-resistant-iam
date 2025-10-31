/**
 * Crypto utility functions to handle TypeScript strict type checking
 */

/**
 * Decrypt data using AES-GCM with proper type handling
 * Workaround for TypeScript BufferSource strict type checking
 */
export async function aesGcmDecrypt(
  ciphertext: Uint8Array,
  key: CryptoKey,
  nonce: Uint8Array
): Promise<ArrayBuffer> {
  // Create a fresh ArrayBuffer copy with manual byte copy to avoid type issues
  const buffer: ArrayBuffer = new ArrayBuffer(ciphertext.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < ciphertext.length; i++) {
    view[i] = ciphertext[i];
  }
  
  return await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce },
    key,
    buffer
  );
}

/**
 * Encrypt data using AES-GCM
 */
export async function aesGcmEncrypt(
  data: Uint8Array,
  key: CryptoKey,
  nonce: Uint8Array
): Promise<ArrayBuffer> {
  // Create a fresh ArrayBuffer copy with manual byte copy to avoid type issues
  const buffer: ArrayBuffer = new ArrayBuffer(data.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < data.length; i++) {
    view[i] = data[i];
  }
  
  return await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    key,
    buffer
  );
}
