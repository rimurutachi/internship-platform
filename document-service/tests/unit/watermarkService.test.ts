import watermarkService from '../../src/services/watermarkService';

describe('WatermarkService', () => {
  const baseOptions = {
    signatureId: 'sig-001',
    documentId: 'doc-001',
    documentName: 'Test Document.pdf',
    verificationUrl: 'https://example.com/verify/sig-001',
  };

  describe('generateQRCode', () => {
    it('should generate a QR code buffer', async () => {
      const buffer = await watermarkService.generateQRCode(baseOptions);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should generate different QR codes for different signatures', async () => {
      const qr1 = await watermarkService.generateQRCode(baseOptions);
      const qr2 = await watermarkService.generateQRCode({
        ...baseOptions,
        signatureId: 'sig-002',
      });

      // Different input should produce different output
      expect(qr1.equals(qr2)).toBe(false);
    });
  });

  describe('extractQRMetadata', () => {
    it('should parse valid QR JSON data', () => {
      const qrData = JSON.stringify({
        signatureId: 'sig-001',
        documentId: 'doc-001',
        timestamp: '2026-01-01T00:00:00Z',
        verificationUrl: 'https://example.com/verify',
      });

      const result = watermarkService.extractQRMetadata(qrData);

      expect(result.signatureId).toBe('sig-001');
      expect(result.documentId).toBe('doc-001');
      expect(result.verificationUrl).toBe('https://example.com/verify');
    });

    it('should throw on invalid JSON', () => {
      expect(() => watermarkService.extractQRMetadata('not-json')).toThrow(
        'Invalid QR data format'
      );
    });
  });

  describe('verifyQRIntegrity', () => {
    const validQRData = {
      signatureId: 'sig-001',
      documentId: 'doc-001',
      timestamp: '2026-01-01T00:00:00Z',
      verificationUrl: 'https://example.com/verify',
    };

    it('should return true for matching signature and document IDs', () => {
      const result = watermarkService.verifyQRIntegrity(
        validQRData,
        'sig-001',
        'doc-001'
      );

      expect(result).toBe(true);
    });

    it('should return false for mismatched signature ID', () => {
      const result = watermarkService.verifyQRIntegrity(
        validQRData,
        'sig-999',
        'doc-001'
      );

      expect(result).toBe(false);
    });

    it('should return false for mismatched document ID', () => {
      const result = watermarkService.verifyQRIntegrity(
        validQRData,
        'sig-001',
        'doc-999'
      );

      expect(result).toBe(false);
    });

    it('should return false when both IDs mismatch', () => {
      const result = watermarkService.verifyQRIntegrity(
        validQRData,
        'sig-999',
        'doc-999'
      );

      expect(result).toBe(false);
    });
  });
});
