import request from "supertest";
import { app } from "../../src/server"; // Uses the actual express app

// =============================================================================
// Mocks Setup
// =============================================================================

let mockDocumentData: any = null;
let mockUserData: any = null;

// Mock the Supabase client
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockSingle = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: mockSelect,
      eq: mockEq,
      single: jest.fn(() => {
        if (table === "documents") {
          return Promise.resolve(
            mockDocumentData
              ? { data: mockDocumentData, error: null }
              : { data: null, error: new Error("Not found") }
          );
        } else if (table === "users") {
          return Promise.resolve(
            mockUserData
              ? { data: mockUserData, error: null }
              : { data: null, error: new Error("Not found") }
          );
        }
        return Promise.resolve({ data: null, error: null });
      }),
    })),
  })),
}));

// Mock environment variables
jest.mock("../../src/config/env", () => ({
  env: {
    SUPABASE_URL: "http://localhost:54321",
    SUPABASE_SERVICE_KEY: "test-service-key",
  },
}));

// =============================================================================
// Tests
// =============================================================================

describe("Phase 3: Public QR Verification Endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDocumentData = null;
    mockUserData = null;
  });

  it("should return 404 if the document does not exist", async () => {
    mockDocumentData = null;

    const res = await request(app).get("/api/public/verify/invalid-doc-id");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("not found");
  });

  it("should return 400 if the document is still in draft mode", async () => {
    mockDocumentData = {
      id: "doc-123",
      title: "Draft Document",
      status: "draft",
      owner_id: "user-1",
      metadata: {},
    };

    const res = await request(app).get("/api/public/verify/doc-123");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("not finalized");
    expect(res.body.status).toBe("draft");
  });

  it("should return 400 if the document has no content hash", async () => {
    mockDocumentData = {
      id: "doc-123",
      title: "Pre-approved without hash",
      status: "pre_approved",
      owner_id: "user-1",
      metadata: {
        // Missing content_hash
      },
    };

    const res = await request(app).get("/api/public/verify/doc-123");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("missing integrity signatures");
  });

  it("should return 200 and document metadata if the document is pre_approved", async () => {
    mockDocumentData = {
      id: "doc-123",
      title: "Valid Pre-approved Document",
      status: "pre_approved",
      owner_id: "user-1",
      metadata: {
        content_hash: "mock-hash-12345",
        pre_approved_at: "2026-07-12T00:00:00Z",
        secure_pdf_url: "https://signed.url/pdf",
      },
    };

    mockUserData = {
      first_name: "Juan",
      last_name: "Dela Cruz",
      role: "student",
    };

    const res = await request(app).get("/api/public/verify/doc-123");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.documentId).toBe("doc-123");
    expect(res.body.data.content_hash).toBe("mock-hash-12345");
    expect(res.body.data.secure_pdf_url).toBe("https://signed.url/pdf");
    expect(res.body.data.owner.name).toBe("Juan Dela Cruz");
    expect(res.body.data.owner.role).toBe("student");
  });

  it("should return 200 and document metadata if the document is approved", async () => {
    mockDocumentData = {
      id: "doc-123",
      title: "Valid Approved Document",
      status: "approved",
      owner_id: "user-1",
      metadata: {
        content_hash: "mock-hash-67890",
        updated_at: "2026-07-13T00:00:00Z",
        secure_pdf_url: "https://signed.url/pdf-final",
      },
    };

    mockUserData = {
      first_name: "Maria",
      last_name: "Clara",
      role: "student",
    };

    const res = await request(app).get("/api/public/verify/doc-123");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("approved");
    expect(res.body.data.content_hash).toBe("mock-hash-67890");
    expect(res.body.data.secure_pdf_url).toBe("https://signed.url/pdf-final");
    expect(res.body.data.owner.name).toBe("Maria Clara");
  });
});
