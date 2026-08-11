import request from "supertest";
import { app } from "../../src/server";
import axios from "axios";

// =============================================================================
// Mocks Setup
// =============================================================================

let mockDocumentData: any = null;
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: mockSelect,
      eq: mockEq,
      update: mockUpdate,
      single: jest.fn(() => {
        if (table === "documents" && mockDocumentData) {
          return Promise.resolve({ data: mockDocumentData, error: null });
        }
        return Promise.resolve({ data: null, error: new Error("Not found") });
      }),
    })),
  })),
}));

// Mock Axios for AI Service call
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../src/middleware/auth", () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: "user-123", email: "student@test.com", role: "student" };
    next();
  },
}));

jest.mock("../../src/services/auditService", () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

// =============================================================================
// Tests
// =============================================================================

describe("Phase 4: AI Signature Presence Detection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDocumentData = null;
  });

  it("should return 400 if file_url is not provided", async () => {
    const res = await request(app)
      .post("/api/workflows/doc-123/workflows/upload-signed")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("file_url is required");
  });

  it("should return 400 if document is not in pre_approved status", async () => {
    mockDocumentData = { id: "doc-123", status: "draft" };

    const res = await request(app)
      .post("/api/workflows/doc-123/workflows/upload-signed")
      .send({ file_url: "https://example.com/scanned-file.pdf" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("must be pre-approved");
  });

  it("should return 400 and reject if AI detects NO signatures", async () => {
    mockDocumentData = { id: "doc-123", status: "pre_approved", metadata: {} };

    // AI says no signature
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        has_signature: false,
        confidence_score: 0.99,
        notes: "I did not find any handwriting.",
      },
    });

    const res = await request(app)
      .post("/api/workflows/doc-123/workflows/upload-signed")
      .send({ file_url: "https://example.com/scanned-file.pdf" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("No handwritten signatures detected");
    expect(res.body.ai_analysis.has_signature).toBe(false);

    // Ensure we didn't update to approved
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should return 200 and approve document if AI detects a signature", async () => {
    mockDocumentData = { id: "doc-123", status: "pre_approved", metadata: {} };

    // AI says there is a signature
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        has_signature: true,
        confidence_score: 0.85,
        notes: "Found cursive text at the bottom right.",
      },
    });

    const res = await request(app)
      .post("/api/workflows/doc-123/workflows/upload-signed")
      .send({ file_url: "https://example.com/signed-document.pdf" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("successfully verified");
    expect(res.body.ai_analysis.has_signature).toBe(true);

    // Verify DB update was called to change status to "approved"
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" })
    );
  });

  it("should handle AI service failure gracefully (return 503)", async () => {
    mockDocumentData = { id: "doc-123", status: "pre_approved", metadata: {} };

    mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));

    const res = await request(app)
      .post("/api/workflows/doc-123/workflows/upload-signed")
      .send({ file_url: "https://example.com/signed-document.pdf" });

    expect(res.status).toBe(503);
    expect(res.body.error).toContain("service is currently unavailable");
  });
});
