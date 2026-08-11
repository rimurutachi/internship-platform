import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { PDFDocument as PDFLib, rgb, StandardFonts, degrees } from "pdf-lib";
import crypto from "crypto";
import { storageService } from "./storageService";
import libre from "libreoffice-convert";
import { promisify } from "util";

const convertAsync = promisify(libre.convert);

/**
 * PDF Export Service
 *
 * Generates secure, tamper-evident PDF documents from Tiptap editor content.
 * Used in the hybrid document workflow (Phase 2) after pre-approval.
 *
 * Output PDF includes:
 * - Rendered document content from Tiptap JSON
 * - QR code linking to /verify/:documentId for public verification
 * - Semi-transparent diagonal watermark text ("PRE-APPROVED • INTERN-GALING")
 * - Footer with document UUID and SHA-256 content hash
 */

// =============================================================================
// Types
// =============================================================================

interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, any> }[];
  attrs?: Record<string, any>;
}

interface PDFExportOptions {
  documentId: string;
  documentTitle: string;
  content: TiptapNode | string;
  contentHash: string;
  ownerName: string;
  verificationBaseUrl?: string;
  fileUrl?: string;
}

interface PDFExportResult {
  storagePath: string;
  signedUrl: string;
  fileSizeBytes: number;
  pdfHash: string;
}

// =============================================================================
// Service
// =============================================================================

class PDFExportService {
  private readonly VERIFICATION_BASE_URL: string;
  private readonly WATERMARK_TEXT = "PRE-APPROVED";
  private readonly QR_SIZE = 70; // px
  private readonly PAGE_MARGIN = 50;
  private readonly FONT_SIZE_BODY = 12;
  private readonly FONT_SIZE_HEADING = 18;
  private readonly FONT_SIZE_FOOTER = 8;

  constructor() {
    this.VERIFICATION_BASE_URL =
      process.env.VERIFICATION_BASE_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:3000";
  }

  /**
   * Generate a secure PDF with QR code, watermark, and hash footer.
   * Uploads to Supabase Storage and returns the storage path + signed URL.
   */
  async generateSecurePDF(options: PDFExportOptions): Promise<PDFExportResult> {
    const {
      documentId,
      documentTitle,
      content,
      contentHash,
      ownerName,
      fileUrl,
    } = options;

    const verificationUrl = `${this.VERIFICATION_BASE_URL}/verify/${documentId}`;

    console.log("📄 [PDFExport] Generating secure PDF", {
      documentId: documentId.substring(0, 8),
      title: documentTitle,
      hashPrefix: contentHash.substring(0, 16),
    });

    let rawPdfBuffer: Buffer;

    // Step 1: Get the document content as PDF
    if (fileUrl && (fileUrl.toLowerCase().endsWith(".docx") || fileUrl.toLowerCase().endsWith(".doc"))) {
      console.log("📄 [PDFExport] Downloading and converting DOCX to PDF");
      // Download the DOCX file from storage
      const docxBuffer = await storageService.downloadFile(fileUrl);
      
      // Convert to PDF using LibreOffice
      // @ts-ignore
      rawPdfBuffer = await convertAsync(docxBuffer, ".pdf", undefined);
    } else {
      console.log("📄 [PDFExport] Rendering Tiptap content to PDF");
      // Render document content to PDF buffer using pdfkit
      rawPdfBuffer = await this.renderContentToPDF({
        title: documentTitle,
        content,
        ownerName,
        documentId,
        contentHash,
      });
    }

    // Step 2: Generate QR code buffer
    const qrBuffer = await this.generateQRCode(verificationUrl, documentId, contentHash);

    // Step 3: Overlay QR code, watermark, and footer using pdf-lib
    const securePdfBuffer = await this.overlaySecurityFeatures(
      rawPdfBuffer,
      qrBuffer,
      {
        documentId,
        contentHash,
        verificationUrl,
      }
    );

    // Step 4: Compute hash of final PDF
    const pdfHash = crypto
      .createHash("sha256")
      .update(securePdfBuffer)
      .digest("hex");

    // Step 5: Upload to Supabase Storage
    const fileName = `${documentTitle.replace(/[^a-zA-Z0-9]/g, "_")}_pre_approved.pdf`;
    const { path: storagePath } = await storageService.uploadDocumentFile({
      documentId,
      buffer: securePdfBuffer,
      fileName,
      contentType: "application/pdf",
    });

    // Step 6: Generate signed URL
    const signedUrl = await storageService.createSignedUrl(storagePath, 3600);

    console.log("✅ [PDFExport] Secure PDF generated and uploaded", {
      documentId: documentId.substring(0, 8),
      storagePath,
      fileSize: securePdfBuffer.length,
    });

    return {
      storagePath,
      signedUrl,
      fileSizeBytes: securePdfBuffer.length,
      pdfHash,
    };
  }

  /**
   * Render Tiptap JSON content to a PDF buffer using pdfkit.
   */
  private renderContentToPDF(params: {
    title: string;
    content: TiptapNode | string;
    ownerName: string;
    documentId: string;
    contentHash: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "LETTER",
          margins: {
            top: this.PAGE_MARGIN + 30, // Extra top margin for QR code header
            bottom: this.PAGE_MARGIN + 20, // Extra bottom for footer
            left: this.PAGE_MARGIN,
            right: this.PAGE_MARGIN,
          },
          info: {
            Title: params.title,
            Author: params.ownerName,
            Subject: "Pre-Approved Document — Intern-Galing Platform",
            Keywords: `document-id:${params.documentId}`,
            Creator: "Intern-Galing Document Service",
          },
          bufferPages: true,
        });

        const chunks: Uint8Array[] = [];
        doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // === Render content ===
        const contentNode: TiptapNode =
          typeof params.content === "string"
            ? JSON.parse(params.content)
            : params.content;

        this.renderTiptapNode(doc, contentNode);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Recursively render a Tiptap node tree to pdfkit.
   */
  private renderTiptapNode(doc: PDFKit.PDFDocument, node: TiptapNode): void {
    if (!node) return;

    switch (node.type) {
      case "doc":
        if (node.content) {
          for (const child of node.content) {
            this.renderTiptapNode(doc, child);
          }
        }
        break;

      case "paragraph":
        if (node.content) {
          for (const child of node.content) {
            this.renderInlineNode(doc, child);
          }
        }
        doc.moveDown(0.5);
        break;

      case "heading": {
        const level = node.attrs?.level || 1;
        const sizes: Record<number, number> = { 1: 18, 2: 16, 3: 14, 4: 13 };
        doc.font("Helvetica-Bold").fontSize(sizes[level] || 12);
        if (node.content) {
          for (const child of node.content) {
            this.renderInlineNode(doc, child);
          }
        }
        doc.moveDown(0.5);
        doc.font("Helvetica").fontSize(this.FONT_SIZE_BODY);
        break;
      }

      case "bulletList":
      case "orderedList": {
        let itemIndex = 1;
        if (node.content) {
          for (const item of node.content) {
            const prefix = node.type === "orderedList" ? `${itemIndex}. ` : "•  ";
            doc
              .font("Helvetica")
              .fontSize(this.FONT_SIZE_BODY)
              .text(prefix, { continued: true, indent: 20 });

            if (item.content) {
              for (const para of item.content) {
                if (para.content) {
                  for (const inlineNode of para.content) {
                    this.renderInlineNode(doc, inlineNode);
                  }
                }
              }
            }
            doc.moveDown(0.25);
            itemIndex++;
          }
        }
        doc.moveDown(0.25);
        break;
      }

      case "blockquote":
        doc.fillColor("#555555");
        doc.text("│ ", { continued: true, indent: 10 });
        if (node.content) {
          for (const child of node.content) {
            this.renderTiptapNode(doc, child);
          }
        }
        doc.fillColor("#000000");
        break;

      case "horizontalRule":
        doc.moveDown(0.5);
        doc
          .moveTo(this.PAGE_MARGIN, doc.y)
          .lineTo(doc.page.width - this.PAGE_MARGIN, doc.y)
          .strokeColor("#dddddd")
          .lineWidth(0.5)
          .stroke();
        doc.moveDown(0.5);
        break;

      case "hardBreak":
        doc.moveDown(0.5);
        break;

      default:
        // Fallback: try rendering children
        if (node.content) {
          for (const child of node.content) {
            this.renderTiptapNode(doc, child);
          }
        }
        break;
    }
  }

  /**
   * Render an inline text node with marks (bold, italic, etc.)
   */
  private renderInlineNode(doc: PDFKit.PDFDocument, node: TiptapNode): void {
    if (node.type !== "text" || !node.text) return;

    let fontName = "Helvetica";
    const marks = node.marks || [];

    const isBold = marks.some((m) => m.type === "bold");
    const isItalic = marks.some((m) => m.type === "italic");

    if (isBold && isItalic) fontName = "Helvetica-BoldOblique";
    else if (isBold) fontName = "Helvetica-Bold";
    else if (isItalic) fontName = "Helvetica-Oblique";

    doc.font(fontName).fontSize(this.FONT_SIZE_BODY);

    // Check for underline mark
    const hasUnderline = marks.some((m) => m.type === "underline");
    if (hasUnderline) {
      doc.text(node.text, { underline: true, continued: true });
    } else {
      doc.text(node.text, { continued: true });
    }
  }

  /**
   * Generate a QR code PNG buffer encoding verification data.
   */
  async generateQRCode(
    verificationUrl: string,
    documentId: string,
    contentHash: string
  ): Promise<Buffer> {
    const qrPayload = JSON.stringify({
      url: verificationUrl,
      documentId,
      hash: contentHash.substring(0, 16), // Short hash for QR
      ts: new Date().toISOString(),
    });

    const qrBuffer = await QRCode.toBuffer(qrPayload, {
      errorCorrectionLevel: "H",
      width: this.QR_SIZE,
      margin: 1,
    });

    console.log("✅ [PDFExport] QR code generated", { bytes: qrBuffer.length });
    return qrBuffer;
  }

  /**
   * Use pdf-lib to overlay security features on the generated PDF:
   * - QR code in the top-right header area
   * - Diagonal watermark text across all pages
   * - Footer with document ID + content hash
   */
  async overlaySecurityFeatures(
    pdfBuffer: Buffer,
    qrBuffer: Buffer,
    metadata: {
      documentId: string;
      contentHash: string;
      verificationUrl: string;
    }
  ): Promise<Buffer> {
    const pdfDoc = await PDFLib.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Embed QR image
    const qrImage = await pdfDoc.embedPng(qrBuffer);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // --- QR Code: top-right corner (first page only) ---
      if (i === 0) {
        const qrDrawSize = 70;
        page.drawImage(qrImage, {
          x: width - qrDrawSize - 20,
          y: height - qrDrawSize - 20,
          width: qrDrawSize,
          height: qrDrawSize,
        });

        // "Scan to verify" text below QR
        page.drawText("Scan to verify", {
          x: width - qrDrawSize - 15,
          y: height - qrDrawSize - 30,
          size: 7,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      // --- Diagonal Watermark: all pages ---
      page.drawText(this.WATERMARK_TEXT, {
        x: width * 0.08,
        y: height * 0.35,
        size: 42,
        font: helveticaFont,
        color: rgb(0.85, 0.85, 0.85),
        opacity: 0.2,
        rotate: degrees(35),
      });
    }

    const finalBytes = await pdfDoc.save();
    return Buffer.from(finalBytes);
  }
}

export const pdfExportService = new PDFExportService();
export default pdfExportService;
