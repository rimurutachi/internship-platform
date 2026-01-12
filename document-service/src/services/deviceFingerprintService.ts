import crypto from 'crypto';

/**
 * Device Fingerprint Service
 * Captures metadata about device/location for signature verification
 * Used to detect anomalies in signature patterns
 */

export interface DeviceFingerprint {
  ip_address: string;
  device_fingerprint: string;
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  user_agent: string;
  timestamp: string;
  signature_hash: string; // Hash of all metadata for integrity check
}

class DeviceFingerprintService {
  /**
   * Extract IP address from request
   * Handles X-Forwarded-For, X-Real-IP headers for proxied requests
   */
  extractIPAddress(req: any): string {
    console.log(`🔵 Extracting IP address from request`);

    // Check various headers for IP (proxy-aware)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
      return (ips[0] as string).trim();
    }

    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return typeof realIp === 'string' ? realIp.trim() : realIp[0];
    }

    const remoteAddr = req.socket?.remoteAddress || req.connection?.remoteAddress;
    return remoteAddr || 'unknown';
  }

  /**
   * Generate device fingerprint from user agent and other headers
   * Creates unique identifier for device/browser combination
   */
  generateDeviceFingerprint(req: any): string {
    console.log(`🔵 Generating device fingerprint`);

    const userAgent = req.headers['user-agent'] || 'unknown';
    const acceptLanguage = req.headers['accept-language'] || 'unknown';
    const acceptEncoding = req.headers['accept-encoding'] || 'unknown';

    // Combine multiple factors for more unique fingerprint
    const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;

    // Create SHA-256 hash
    const fingerprint = crypto
      .createHash('sha256')
      .update(fingerprintData)
      .digest('hex');

    console.log(`✅ Device fingerprint generated: ${fingerprint.substring(0, 16)}...`);
    return fingerprint;
  }

  /**
   * Extract geolocation from IP
   * This is a placeholder - in production use MaxMind GeoIP2 or similar
   */
  async extractGeolocation(
    ipAddress: string
  ): Promise<DeviceFingerprint['geolocation']> {
    console.log(`🔵 Extracting geolocation for IP: ${ipAddress}`);

    try {
      // TODO: Integrate with MaxMind GeoIP2 or similar service
      // For now, return null (implement with actual GeoIP service)
      if (ipAddress === 'unknown' || ipAddress === 'localhost' || ipAddress === '127.0.0.1') {
        console.log(`⚠️ Skipping geolocation for local/unknown IP`);
        return undefined;
      }

      // Placeholder: Would call GeoIP API here
      // const geoData = await geoipService.lookup(ipAddress);
      // return { country: geoData.country, region: geoData.region, ...};

      return undefined;
    } catch (error) {
      console.warn(`⚠️ Failed to extract geolocation:`, error);
      return undefined;
    }
  }

  /**
   * Create complete device fingerprint record
   */
  async createFingerprint(req: any): Promise<DeviceFingerprint> {
    console.log(`🔵 Creating device fingerprint record`);

    try {
      const ipAddress = this.extractIPAddress(req);
      const deviceFingerprint = this.generateDeviceFingerprint(req);
      const geolocation = await this.extractGeolocation(ipAddress);
      const userAgent = req.headers['user-agent'] || 'unknown';
      const timestamp = new Date().toISOString();

      // Create integrity hash of all metadata
      const signatureData = `${ipAddress}|${deviceFingerprint}|${userAgent}|${timestamp}`;
      const signatureHash = crypto
        .createHash('sha256')
        .update(signatureData)
        .digest('hex');

      const fingerprint: DeviceFingerprint = {
        ip_address: ipAddress,
        device_fingerprint: deviceFingerprint,
        geolocation,
        user_agent: userAgent,
        timestamp,
        signature_hash: signatureHash,
      };

      console.log(`✅ Device fingerprint created:`, {
        ip: ipAddress,
        fingerprint: deviceFingerprint.substring(0, 16) + '...',
        timestamp,
      });

      return fingerprint;
    } catch (error) {
      console.error(`❌ Failed to create device fingerprint:`, error);
      throw new Error(
        `Device fingerprint creation failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Verify fingerprint integrity
   * Checks if metadata hasn't been tampered with
   */
  verifyFingerprint(fingerprint: DeviceFingerprint): boolean {
    console.log(`🔵 Verifying fingerprint integrity`);

    try {
      const signatureData = `${fingerprint.ip_address}|${fingerprint.device_fingerprint}|${fingerprint.user_agent}|${fingerprint.timestamp}`;
      const expectedHash = crypto
        .createHash('sha256')
        .update(signatureData)
        .digest('hex');

      const isValid = expectedHash === fingerprint.signature_hash;

      if (isValid) {
        console.log(`✅ Fingerprint integrity verified`);
      } else {
        console.warn(`⚠️ Fingerprint integrity check failed - potential tampering`);
      }

      return isValid;
    } catch (error) {
      console.error(`❌ Failed to verify fingerprint:`, error);
      return false;
    }
  }

  /**
   * Compare two fingerprints for anomaly detection
   * Returns similarity score 0-1 (1 = identical)
   */
  compareFingerprints(
    fingerprint1: DeviceFingerprint,
    fingerprint2: DeviceFingerprint
  ): number {
    console.log(`🔵 Comparing device fingerprints`);

    let matches = 0;
    let totalFactors = 0;

    // Check each factor
    if (fingerprint1.ip_address === fingerprint2.ip_address) matches++;
    totalFactors++;

    if (fingerprint1.device_fingerprint === fingerprint2.device_fingerprint)
      matches++;
    totalFactors++;

    if (fingerprint1.user_agent === fingerprint2.user_agent) matches++;
    totalFactors++;

    if (
      fingerprint1.geolocation?.country === fingerprint2.geolocation?.country &&
      fingerprint1.geolocation?.country
    ) {
      matches++;
    }
    totalFactors++;

    const similarity = matches / totalFactors;
    console.log(
      `📊 Fingerprint similarity: ${(similarity * 100).toFixed(1)}% (${matches}/${totalFactors})`
    );

    return similarity;
  }

  /**
   * Detect suspicious signature patterns
   * Compares current fingerprint with previous signatures
   */
  detectAnomalies(
    currentFingerprint: DeviceFingerprint,
    previousFingerprints: DeviceFingerprint[]
  ): {
    isSuspicious: boolean;
    riskScore: number; // 0-100
    anomalies: string[];
  } {
    console.log(`🔵 Detecting signature anomalies`);

    const anomalies: string[] = [];
    let riskScore = 0;

    if (previousFingerprints.length === 0) {
      console.log(`ℹ️ No previous fingerprints to compare`);
      return { isSuspicious: false, riskScore: 0, anomalies: [] };
    }

    // Check for IP changes
    const previousIPs = new Set(previousFingerprints.map((f) => f.ip_address));
    if (!previousIPs.has(currentFingerprint.ip_address)) {
      anomalies.push('IP address changed');
      riskScore += 20;
    }

    // Check for device changes
    const previousDevices = new Set(
      previousFingerprints.map((f) => f.device_fingerprint)
    );
    if (!previousDevices.has(currentFingerprint.device_fingerprint)) {
      anomalies.push('Device/browser changed');
      riskScore += 15;
    }

    // Check for geographic anomalies
    const lastLocation = previousFingerprints[0].geolocation;
    if (
      lastLocation &&
      currentFingerprint.geolocation &&
      lastLocation.country !== currentFingerprint.geolocation.country
    ) {
      anomalies.push('Geographic location changed');
      riskScore += 25;
    }

    // Check for multiple devices/IPs (sign of fraud)
    if (previousDevices.size > 3) {
      anomalies.push('Multiple devices detected');
      riskScore += 30;
    }

    const isSuspicious = riskScore >= 40; // Threshold

    console.log(
      isSuspicious ? `⚠️ Suspicious activity detected!` : `✅ No anomalies detected`
    );
    console.log(`Risk score: ${riskScore}/100, Anomalies: ${anomalies.length}`);

    return { isSuspicious, riskScore: Math.min(riskScore, 100), anomalies };
  }
}

export default new DeviceFingerprintService();
