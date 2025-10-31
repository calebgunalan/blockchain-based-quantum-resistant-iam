/**
 * Device Fingerprinting for Zero-Trust Security
 * Generates unique device signatures for anomaly detection
 */

export interface DeviceFingerprint {
  deviceId: string;
  browser: string;
  os: string;
  platform: string;
  userAgent: string;
  language: string;
  languages: string[];
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  timezoneOffset: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  maxTouchPoints: number;
  vendor: string;
  webgl: string;
  canvas: string;
  audioContext: string;
  timestamp: string;
}

export class DeviceFingerprintGenerator {
  /**
   * Generate comprehensive device fingerprint
   */
  static async generate(): Promise<DeviceFingerprint> {
    const canvas = await this.getCanvasFingerprint();
    const webgl = await this.getWebGLFingerprint();
    const audio = await this.getAudioFingerprint();

    const fingerprint: DeviceFingerprint = {
      deviceId: '', // Will be calculated from all components
      browser: this.getBrowser(),
      os: this.getOS(),
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: Array.from(navigator.languages || [navigator.language]),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      vendor: navigator.vendor,
      webgl,
      canvas,
      audioContext: audio,
      timestamp: new Date().toISOString()
    };

    // Generate unique device ID from fingerprint components
    fingerprint.deviceId = await this.hashFingerprint(fingerprint);

    return fingerprint;
  }

  /**
   * Calculate trust score based on device fingerprint
   */
  static calculateTrustScore(
    fingerprint: DeviceFingerprint,
    previousFingerprints: DeviceFingerprint[] = []
  ): number {
    let score = 50; // Base score

    // Known device bonus
    const isKnownDevice = previousFingerprints.some(
      fp => fp.deviceId === fingerprint.deviceId
    );
    if (isKnownDevice) {
      score += 30;
    }

    // Suspicious indicators
    if (fingerprint.userAgent.includes('Headless')) score -= 40;
    if (fingerprint.webgl === 'blocked') score -= 20;
    if (fingerprint.languages.length === 0) score -= 10;
    if (!fingerprint.timezone) score -= 10;
    
    // Privacy-focused browser detection (not necessarily suspicious)
    if (fingerprint.canvas === 'blocked' || fingerprint.audioContext === 'blocked') {
      score -= 5; // Minor penalty for privacy tools
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect suspicious patterns indicating bot or attacker
   */
  static detectAnomalies(fingerprint: DeviceFingerprint): string[] {
    const anomalies: string[] = [];

    if (fingerprint.userAgent.includes('Headless')) {
      anomalies.push('Headless browser detected');
    }

    if (fingerprint.hardwareConcurrency === 0) {
      anomalies.push('No CPU cores reported');
    }

    if (fingerprint.maxTouchPoints > 20) {
      anomalies.push('Unusual touch point count');
    }

    if (!fingerprint.timezone || fingerprint.timezone === 'UTC') {
      anomalies.push('Generic or missing timezone');
    }

    if (fingerprint.languages.length === 0) {
      anomalies.push('No languages reported');
    }

    if (fingerprint.webgl === 'blocked' && fingerprint.canvas === 'blocked') {
      anomalies.push('Multiple fingerprinting APIs blocked');
    }

    return anomalies;
  }

  /**
   * Get browser name
   */
  private static getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Get operating system
   */
  private static getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Generate Canvas fingerprint
   */
  private static async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'unavailable';

      canvas.width = 200;
      canvas.height = 50;

      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 200, 50);
      ctx.fillStyle = '#069';
      ctx.fillText('Device Fingerprint', 2, 15);

      const dataURL = canvas.toDataURL();
      return await this.simpleHash(dataURL);
    } catch {
      return 'blocked';
    }
  }

  /**
   * Generate WebGL fingerprint
   */
  private static async getWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'unavailable';

      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return 'no-debug-info';

      const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

      return await this.simpleHash(`${vendor}~${renderer}`);
    } catch {
      return 'blocked';
    }
  }

  /**
   * Generate Audio fingerprint
   */
  private static async getAudioFingerprint(): Promise<string> {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return 'unavailable';

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0;
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(0);

      const hash = await this.simpleHash(
        `${context.sampleRate}~${analyser.frequencyBinCount}`
      );

      oscillator.stop();
      context.close();

      return hash;
    } catch {
      return 'blocked';
    }
  }

  /**
   * Hash fingerprint data
   */
  private static async hashFingerprint(fingerprint: DeviceFingerprint): Promise<string> {
    const data = JSON.stringify({
      browser: fingerprint.browser,
      os: fingerprint.os,
      platform: fingerprint.platform,
      screenResolution: fingerprint.screenResolution,
      timezone: fingerprint.timezone,
      canvas: fingerprint.canvas,
      webgl: fingerprint.webgl,
      audio: fingerprint.audioContext
    });

    return await this.simpleHash(data);
  }

  /**
   * Simple hash function using SubtleCrypto
   */
  private static async simpleHash(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback to simple string hash
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    }
  }
}
