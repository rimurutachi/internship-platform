import { PDFDocument as PDFLib } from "pdf-lib";
import crypto from "crypto";

// =============================================================================
// Mocks
// =============================================================================

// 1. Mock the storage service BEFORE importing the actual service
jest.mock("../../src/services/storageService", () => ({
  __esModule: true,
  storageService: {
    uploadDocumentFile: jest.fn().mockResolvedValue({
      path: "test/doc-123_pre_approved.pdf",
      checksum: "mock-checksum-123",
    }),
    createSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/doc-123"),
    removeFile: jest.fn().mockResolvedValue(undefined),
  },
  default: {
    uploadDocumentFile: jest.fn().mockResolvedValue({
      path: "test/doc-123_pre_approved.pdf",
      checksum: "mock-checksum-123",
    }),
  },
}));

// 2. Mock environment variables
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    VERIFICATION_BASE_URL: "http://test-verification.com",
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Import the service after mocking
import { pdfExportService } from "../../src/services/pdfExportService";
import { storageService } from "../../src/services/storageService";

// =============================================================================
// Tests
// =============================================================================

describe("Phase 2: PDF Export Service", () => {
  const mockContentHash = crypto.createHash("sha256").update("test content").digest("hex");
  const mockOptions = {
    documentId: "doc-123-abc",
    documentTitle: "Internship MOA Test",
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Memorandum of Agreement" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "This is a " },
            { type: "text", marks: [{ type: "bold" }], text: "secure document" },
            { type: "text", text: "." },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 1" }],
                },
              ],
            },
          ],
        },
      ],
    },
    contentHash: mockContentHash,
    ownerName: "Juan Dela Cruz",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("QR Code Generation", () => {
    it("should generate a valid PNG buffer for the QR code", async () => {
      const url = "http://test-verification.com/verify/doc-123-abc";
      const buffer = await pdfExportService.generateQRCode(url, "doc-123-abc", mockContentHash);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);

      // Verify it has the PNG magic number signature (89 50 4E 47 0D 0A 1A 0A)
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50); // P
      expect(buffer[2]).toBe(0x4e); // N
      expect(buffer[3]).toBe(0x47); // G
    });
  });

  describe("Full PDF Generation Workflow", () => {
    it("should generate a complete secure PDF and upload it to storage", async () => {
      const result = await pdfExportService.generateSecurePDF(mockOptions);

      // Verify output structure
      expect(result).toHaveProperty("storagePath");
      expect(result).toHaveProperty("signedUrl", "https://signed-url.com/doc-123");
      expect(result).toHaveProperty("fileSizeBytes");
      expect(result.fileSizeBytes).toBeGreaterThan(1000); // Should be a substantial PDF file
      expect(result).toHaveProperty("pdfHash");
      expect(result.pdfHash).toHaveLength(64); // SHA-256 length

      // Verify storage service was called correctly
      expect(storageService.uploadDocumentFile).toHaveBeenCalledTimes(1);
      
      const uploadArgs = (storageService.uploadDocumentFile as jest.Mock).mock.calls[0][0];
      expect(uploadArgs.documentId).toBe(mockOptions.documentId);
      expect(uploadArgs.contentType).toBe("application/pdf");
      expect(uploadArgs.fileName).toMatch(/Internship_MOA_Test_pre_approved\.pdf/);
      expect(uploadArgs.buffer).toBeInstanceOf(Buffer);

      // Verify signed URL generation was called
      expect(storageService.createSignedUrl).toHaveBeenCalledWith(
        "test/doc-123_pre_approved.pdf",
        3600
      );

      // Deep verify the generated PDF buffer contains exactly 1 page
      // (Using pdf-lib to read back the generated PDF)
      const generatedPdfDoc = await PDFLib.load(uploadArgs.buffer);
      const pages = generatedPdfDoc.getPages();
      expect(pages.length).toBe(1);
      
      const { width, height } = pages[0].getSize();
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    });

    it("should handle stringified JSON content", async () => {
      const stringifiedOptions = {
        ...mockOptions,
        content: JSON.stringify(mockOptions.content),
      };

      const result = await pdfExportService.generateSecurePDF(stringifiedOptions);

      expect(result.storagePath).toBeDefined();
      expect(storageService.uploadDocumentFile).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if storage upload fails", async () => {
      const uploadError = new Error("Storage quota exceeded");
      (storageService.uploadDocumentFile as jest.Mock).mockRejectedValueOnce(uploadError);

      await expect(pdfExportService.generateSecurePDF(mockOptions)).rejects.toThrow("Storage quota exceeded");
    });
  });
});
