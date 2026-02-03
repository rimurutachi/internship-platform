import QRCode from 'qrcode';
import { PDFDocument as PDFLib, rgb } from 'pdf-lib';

/**
 * Watermark Service
 * Generates QR codes for signature verification and embeds them on documents
 * Provides tamper detection through QR-encoded signature verification links
 */

interface WatermarkOptions {
  signatureId: string;
  documentId: string;
  documentName: string;
  verificationUrl: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: number;
}

interface QRCodeData {
  signatureId: string;
  documentId: string;
  timestamp: string;
  verificationUrl: string;
}

class WatermarkService {
  private readonly QR_SIZE = 150; // pixels
  private readonly QR_ERROR_CORRECTION = 'H'; // High error correction
  private readonly MARGIN = 20; // pixels from edge

  /**
   * Generate QR code as image buffer
   * Encodes signature verification link for easy verification
   */
  async generateQRCode(options: WatermarkOptions): Promise<Buffer> {
    console.log(`🔵 Generating QR code for signature ${options.signatureId}`);

    try {
      const qrData: QRCodeData = {
        signatureId: options.signatureId,
        documentId: options.documentId,
        timestamp: new Date().toISOString(),
        verificationUrl: options.verificationUrl,
      };

      const qrText = JSON.stringify(qrData);

      // Generate QR code as PNG buffer
      const qrBuffer = await QRCode.toBuffer(qrText, {
        errorCorrectionLevel: this.QR_ERROR_CORRECTION,
        width: this.QR_SIZE,
      });

      console.log(`✅ QR code generated: ${qrBuffer.length} bytes`);
      return qrBuffer;
    } catch (error) {
      console.error(
        `❌ Failed to generate QR code for ${options.signatureId}:`,
        error
      );
      throw new Error(`QR code generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Embed QR code on PDF document
   * Adds watermark with verification link at specified corner
   */
  async embedQROnPDF(
    pdfBuffer: Buffer,
    qrBuffer: Buffer,
    options: WatermarkOptions
  ): Promise<Buffer> {
    console.log(`🔵 Embedding QR watermark on PDF: ${options.documentName}`);

    try {
      // Load PDF using pdf-lib
      const pdfDoc = await PDFLib.load(pdfBuffer);
      const pages = pdfDoc.getPages();

      // Get last page (where we'll add watermark)
      const lastPageIndex = pages.length - 1;
      const lastPage = pages[lastPageIndex];
      const { width: pageWidth, height: pageHeight } = lastPage.getSize();

      // Embed QR image
      const qrImage = await pdfDoc.embedPng(qrBuffer);
      const qrWidth = 100; // pixels
      const qrHeight = 100; // pixels

      // Calculate position based on option
      let xPos: number;
      let yPos: number;

      switch (options.position || 'bottom-right') {
        case 'bottom-right':
          xPos = pageWidth - qrWidth - this.MARGIN;
          yPos = this.MARGIN;
          break;
        case 'bottom-left':
          xPos = this.MARGIN;
          yPos = this.MARGIN;
          break;
        case 'top-right':
          xPos = pageWidth - qrWidth - this.MARGIN;
          yPos = pageHeight - qrHeight - this.MARGIN;
          break;
        case 'top-left':
          xPos = this.MARGIN;
          yPos = pageHeight - qrHeight - this.MARGIN;
          break;
        default:
          xPos = pageWidth - qrWidth - this.MARGIN;
          yPos = this.MARGIN;
      }

      // Draw semi-transparent white background
      lastPage.drawRectangle({
        x: xPos - 5,
        y: yPos - 5,
        width: qrWidth + 10,
        height: qrHeight + 10,
        color: rgb(1, 1, 1), // white
        opacity: 0.1,
      });

      // Draw QR code
      lastPage.drawImage(qrImage, {
        x: xPos,
        y: yPos,
        width: qrWidth,
        height: qrHeight,
      });

      // Add verification text below QR
      const fontSize = 8;
      lastPage.drawText('Scan to verify', {
        x: xPos,
        y: yPos - fontSize - 5,
        size: fontSize,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Save modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      const modifiedPdfBuffer = Buffer.from(modifiedPdfBytes);

      console.log(
        `✅ QR watermark embedded on PDF: ${modifiedPdfBuffer.length} bytes`
      );
      return modifiedPdfBuffer;
    } catch (error) {
      console.error(
        `❌ Failed to embed QR on PDF ${options.documentName}:`,
        error
      );
      throw new Error(`PDF embedding failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create watermarked document (combined QR generation + embedding)
   */
  async createWatermarkedDocument(
    documentBuffer: Buffer,
    options: WatermarkOptions
  ): Promise<Buffer> {
    console.log(`🔵 Creating watermarked document: ${options.documentName}`);

    try {
      // Step 1: Generate QR code
      const qrBuffer = await this.generateQRCode(options);

      // Step 2: Embed on PDF
      const watermarkedBuffer = await this.embedQROnPDF(
        documentBuffer,
        qrBuffer,
        options
      );

      console.log(
        `✅ Watermarked document created: ${watermarkedBuffer.length} bytes`
      );
      return watermarkedBuffer;
    } catch (error) {
      console.error(`❌ Failed to create watermarked document:`, error);
      throw new Error(
        `Watermark creation failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Extract QR code metadata from watermarked PDF
   * Used for verification and tamper detection
   */
  extractQRMetadata(qrData: string): QRCodeData {
    try {
      const parsed = JSON.parse(qrData) as QRCodeData;
      return parsed;
    } catch (error) {
      console.error(`❌ Failed to parse QR data:`, error);
      throw new Error(`Invalid QR data format: ${(error as Error).message}`);
    }
  }

  /**
   * Verify QR code integrity
   * Checks if QR data matches expected signature/document IDs
   */
  verifyQRIntegrity(
    qrData: QRCodeData,
    expectedSignatureId: string,
    expectedDocumentId: string
  ): boolean {
    console.log(
      `🔵 Verifying QR integrity for signature ${expectedSignatureId}`
    );

    const isValid =
      qrData.signatureId === expectedSignatureId &&
      qrData.documentId === expectedDocumentId;

    if (isValid) {
      console.log(`✅ QR integrity verified`);
    } else {
      console.warn(`⚠️ QR integrity check failed - potential tampering detected`);
    }

    return isValid;
  }
}

export default new WatermarkService();
