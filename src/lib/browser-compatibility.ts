/**
 * Browser Compatibility Detection for Quantum Cryptography
 * Detects support for @noble/post-quantum and Web Crypto API
 */

export interface BrowserCompatibility {
  isSupported: boolean;
  features: {
    webCrypto: boolean;
    subtleCrypto: boolean;
    randomValues: boolean;
    wasmSupport: boolean;
    bigIntSupport: boolean;
  };
  warnings: string[];
  browser: {
    name: string;
    version: string;
    isModern: boolean;
  };
}

/**
 * Detect browser information
 */
function detectBrowser(): { name: string; version: string; isModern: boolean } {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';
  
  if (ua.indexOf('Firefox') > -1) {
    name = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    name = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.indexOf('Edg') > -1) {
    name = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    name = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  
  // Modern browser versions
  const modernVersions: Record<string, number> = {
    Chrome: 90,
    Firefox: 88,
    Safari: 14,
    Edge: 90,
  };
  
  const versionNum = parseInt(version);
  const isModern = !isNaN(versionNum) && versionNum >= (modernVersions[name] || 999);
  
  return { name, version, isModern };
}

/**
 * Check WebAssembly support
 */
function checkWasmSupport(): boolean {
  try {
    if (typeof WebAssembly === 'object' && 
        typeof WebAssembly.instantiate === 'function') {
      const module = new WebAssembly.Module(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
      );
      return module instanceof WebAssembly.Module;
    }
  } catch (e) {
    return false;
  }
  return false;
}

/**
 * Check BigInt support
 */
function checkBigIntSupport(): boolean {
  try {
    return typeof BigInt === 'function' && typeof BigInt(1) === 'bigint';
  } catch (e) {
    return false;
  }
}

/**
 * Check Web Crypto API support
 */
function checkWebCrypto(): { 
  webCrypto: boolean; 
  subtleCrypto: boolean; 
  randomValues: boolean;
} {
  const webCrypto = typeof window !== 'undefined' && 
                    typeof window.crypto !== 'undefined';
  
  const subtleCrypto = webCrypto && 
                       typeof window.crypto.subtle !== 'undefined' &&
                       typeof window.crypto.subtle.digest === 'function';
  
  const randomValues = webCrypto && 
                       typeof window.crypto.getRandomValues === 'function';
  
  return { webCrypto, subtleCrypto, randomValues };
}

/**
 * Perform comprehensive browser compatibility check
 */
export async function checkBrowserCompatibility(): Promise<BrowserCompatibility> {
  const browser = detectBrowser();
  const crypto = checkWebCrypto();
  const wasmSupport = checkWasmSupport();
  const bigIntSupport = checkBigIntSupport();
  
  const warnings: string[] = [];
  
  // Check critical features
  if (!crypto.webCrypto) {
    warnings.push('Web Crypto API not available - quantum cryptography will not work');
  }
  if (!crypto.subtleCrypto) {
    warnings.push('SubtleCrypto API not available - hashing operations will fail');
  }
  if (!crypto.randomValues) {
    warnings.push('Secure random number generation not available - insecure fallback will be used');
  }
  if (!wasmSupport) {
    warnings.push('WebAssembly not supported - performance may be degraded');
  }
  if (!bigIntSupport) {
    warnings.push('BigInt not supported - large number operations will fail');
  }
  if (!browser.isModern) {
    warnings.push(`${browser.name} ${browser.version} may not be fully supported. Please update to the latest version.`);
  }
  
  // Test actual crypto operations
  try {
    const testData = new Uint8Array([1, 2, 3, 4]);
    await window.crypto.subtle.digest('SHA-256', testData);
  } catch (e) {
    warnings.push('SHA-256 hashing test failed - cryptographic operations may not work');
  }
  
  const isSupported = crypto.webCrypto && 
                     crypto.subtleCrypto && 
                     crypto.randomValues && 
                     bigIntSupport;
  
  return {
    isSupported,
    features: {
      webCrypto: crypto.webCrypto,
      subtleCrypto: crypto.subtleCrypto,
      randomValues: crypto.randomValues,
      wasmSupport,
      bigIntSupport,
    },
    warnings,
    browser,
  };
}

/**
 * Get recommended browsers
 */
export function getRecommendedBrowsers(): string[] {
  return [
    'Chrome 90+',
    'Firefox 88+',
    'Safari 14+',
    'Edge 90+',
  ];
}
