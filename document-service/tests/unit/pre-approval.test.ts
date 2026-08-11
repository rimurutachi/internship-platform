import crypto from "crypto";

// =============================================================================
// Mocks Setup
// =============================================================================

// Track mock call data for assertions
const mockInsertData: any[] = [];
const mockUpdateData: any[] = [];
let mockDocumentStatus = "draft";
let mockDocumentContent = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello World" }] }] };
let mockDocumentMetadata: Record<string, any> = {};
let mockDocumentOwnerId = "user-owner-001";
let mockAccessControlResult: any = null;

// Build a chainable Supabase mock
function createChainMock(tableName: string) {
  const chain: any = {
    _table: tableName,
    _filters: {} as Record<string, any>,
    _selectedFields: "",

    select: jest.fn(function (this: any, fields?: string) {
      this._selectedFields = fields || "*";
      return this;
    }),
    insert: jest.fn(function (this: any, data: any) {
      mockInsertData.push({ table: tableName, data });
      return this;
    }),
    update: jest.fn(function (this: any, data: any) {
      mockUpdateData.push({ table: tableName, data });
      return this;
    }),
    delete: jest.fn(function (this: any) {
      return this;
    }),
    eq: jest.fn(function (this: any, column: string, value: any) {
      this._filters[column] = value;
      return this;
    }),
    is: jest.fn(function (this: any) {
      return this;
    }),
    in: jest.fn(function (this: any) {
      return this;
    }),
    limit: jest.fn(function (this: any) {
      return this;
    }),
    order: jest.fn(function (this: any) {
      return this;
    }),
    maybeSingle: jest.fn(function (this: any) {
      if (tableName === "document_access_control") {
        return Promise.resolve({ data: mockAccessControlResult, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
    single: jest.fn(function (this: any) {
      if (tableName === "documents") {
        return Promise.resolve({
          data: {
            id: this._filters.id || "doc-001",
            status: mockDocumentStatus,
            content: mockDocumentContent,
            owner_id: mockDocumentOwnerId,
            title: "Test MOA Document",
            metadata: mockDocumentMetadata,
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }),
  };

  // Make all methods return `chain` so chaining works
  for (const key of Object.keys(chain)) {
    if (typeof chain[key] === "function" && key !== "single" && key !== "maybeSingle") {
      const original = chain[key];
      chain[key] = jest.fn(function (this: any, ...args: any[]) {
        original.apply(this, args);
        return chain;
      });
    }
  }

  return chain;
}

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((tableName: string) => createChainMock(tableName)),
  })),
}));

// Mock environment config
jest.mock("../../src/config/env", () => ({
  env: {
    SUPABASE_URL: "http://localhost:54321",
    SUPABASE_SERVICE_KEY: "test-service-key",
    JWT_SECRET: "test-jwt-secret",
    REDIS_URL: "redis://localhost:6379",
  },
}));

// Mock audit service
const mockLogAction = jest.fn().mockResolvedValue(undefined);
jest.mock("../../src/services/auditService", () => ({
  __esModule: true,
  default: { logAction: mockLogAction },
  auditService: { logAction: mockLogAction },
}));

// Mock workflow service
jest.mock("../../src/services/workflowService", () => ({
  __esModule: true,
  default: {
    validateWorkflowDefinition: jest.fn(() => ({ valid: true, errors: [] })),
    getRequiredApprovers: jest.fn().mockResolvedValue([]),
    createApprovals: jest.fn().mockResolvedValue(undefined),
  },
}));

// =============================================================================
// Import after mocks
// =============================================================================
import { preApproveDraft, revertPreApproval } from "../../src/controllers/workflowController";
import { updateDocument } from "../../src/controllers/documentController";

// =============================================================================
// Helpers
// =============================================================================
function createMockRequest(params: any = {}, body: any = {}, user: any = null) {
  return {
    params,
    body,
    user,
    ip: "127.0.0.1",
  } as any;
}

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
  };
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((data: any) => {
    res.jsonData = data;
    res.statusCode = res.statusCode || 200;
    return res;
  });
  return res;
}

// =============================================================================
// Tests
// =============================================================================
describe("Phase 1: Pre-Approval & Content Lock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsertData.length = 0;
    mockUpdateData.length = 0;
    mockDocumentStatus = "draft";
    mockDocumentContent = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello World" }] }] };
    mockDocumentMetadata = {};
    mockDocumentOwnerId = "user-owner-001";
    mockAccessControlResult = null;
  });

  // ===========================================================================
  // preApproveDraft Tests
  // ===========================================================================
  describe("preApproveDraft()", () => {
    it("should return 401 if user is not authenticated", async () => {
      const req = createMockRequest({ documentId: "doc-001" }, {}, null);
      const res = createMockResponse();

      await preApproveDraft(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain("Authentication required");
    });

    it("should transition a draft document to pre_approved status", async () => {
      mockDocumentStatus = "draft";
      mockDocumentOwnerId = "user-001";

      const req = createMockRequest(
        { documentId: "doc-001" },
        {},
        { id: "user-001", role: "student" }
      );
      const res = createMockResponse();

      await preApproveDraft(req, res);

      // Should succeed (200)
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data).toHaveProperty("content_hash");
      expect(res.jsonData.data).toHaveProperty("locked_at");
    });

    it("should generate a valid SHA-256 hash from document content", async () => {
      mockDocumentStatus = "draft";
      mockDocumentOwnerId = "user-001";

      const req = createMockRequest(
        { documentId: "doc-001" },
        {},
        { id: "user-001", role: "student" }
      );
      const res = createMockResponse();

      await preApproveDraft(req, res);

      const contentHash = res.jsonData?.data?.content_hash;
      expect(contentHash).toBeDefined();
      expect(contentHash).toHaveLength(64); // SHA-256 produces 64 hex chars
      expect(contentHash).toMatch(/^[a-f0-9]{64}$/); // Valid hex

      // Verify it matches a manual hash computation
      const expectedHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(mockDocumentContent), "utf8")
        .digest("hex");
      expect(contentHash).toBe(expectedHash);
    });

    it("should reject pre-approval if document is NOT in draft status", async () => {
      mockDocumentStatus = "in_review"; // Not 'draft'
      mockDocumentOwnerId = "user-001";

      const req = createMockRequest(
        { documentId: "doc-001" },
        {},
        { id: "user-001", role: "student" }
      );
      const res = createMockResponse();

      await preApproveDraft(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain("in_review");
    });

    it("should reject pre-approval if document is already pre_approved", async () => {
      mockDocumentStatus = "pre_approved";
      mockDocumentOwnerId = "user-001";

      const req = createMockRequest(
        { documentId: "doc-001" },
        {},
        { id: "user-001", role: "student" }
      );
      const res = createMockResponse();

      await preApproveDraft(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain("pre_approved");
    });

    it("should create an audit log entry on pre-approval", async () => {
      mockDocumentStatus = "draft";
      mockDocumentOwnerId = "user-001";

      const req = createMockRequest(
        { documentId: "doc-001" },
        {},
        { id: "user-001", role: "student" }
      );
      const res = createMockResponse();

      await preApproveDraft(req, res);

      expect(mockLogAction).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: "doc-001",
          userId: "user-001",
          action: "document_pre_approved",
          metadata: expect.objectContaining({
            content_hash: expect.any(String),
            previous_status: "draft",
            new_status: "pre_approved",
          }),
        })
      );
    });

    it("should return 403 if user has no permission", async () => {
      mockDocumentStatus = "draft";
      mockDocumentOwnerId = "user-owner-001"; // Different from requesting user

      const req = createMockRequest(
        { documentId: "doc-001" },
        {},
        { id: "user-random-999", role: "student" }
      );
      const res = createMockResponse();

      await preApproveDraft(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.jsonData.success).toBe(false);
    });
  });

  // ===========================================================================
  // updateDocument content-lock Tests
  // ===========================================================================
  describe("updateDocument() content-lock", () => {
    it("should return 403 when trying to update a pre_approved document", async () => {
      mockDocumentStatus = "pre_approved";

      const req = createMockRequest(
        { id: "doc-001" },
        { content: { text: "modified content" } },
        { id: "user-001", role: "student" }
      );
      const res = createMockResponse();

      await updateDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.code).toBe("DOCUMENT_LOCKED");
    });

    it("should allow updates on documents in draft status", async () => {
      mockDocumentStatus = "draft";

      const req = createMockRequest(
        { id: "doc-001" },
        { content: { text: "new content" } },
        { id: "user-001", role: "student" }
      );
      const res = createMockResponse();

      await updateDocument(req, res);

      // Should NOT return 403
      expect(res.statusCode).not.toBe(403);
    });
  });

  // ===========================================================================
  // revertPreApproval Tests
  // ===========================================================================
  describe("revertPreApproval()", () => {
    it("should return 401 if user is not authenticated", async () => {
      const req = createMockRequest({ documentId: "doc-001" }, {}, null);
      const res = createMockResponse();

      await revertPreApproval(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.success).toBe(false);
    });

    it("should reject revert if document is not pre_approved", async () => {
      mockDocumentStatus = "draft";

      const req = createMockRequest(
        { documentId: "doc-001" },
        { reason: "Need more edits" },
        { id: "user-001", role: "admin" }
      );
      const res = createMockResponse();

      await revertPreApproval(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.jsonData.error).toContain("not pre-approved");
    });

    it("should allow admin to revert a pre-approved document", async () => {
      mockDocumentStatus = "pre_approved";
      mockDocumentMetadata = {
        content_hash: "abc123",
        pre_approved_at: "2026-01-01T00:00:00Z",
        pre_approved_by: "user-advisor-001",
      };

      const req = createMockRequest(
        { documentId: "doc-001" },
        { reason: "Student needs to make corrections" },
        { id: "user-admin-001", role: "admin" }
      );
      const res = createMockResponse();

      await revertPreApproval(req, res);

      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.message).toContain("reverted to draft");
    });

    it("should reject revert from non-admin non-approver", async () => {
      mockDocumentStatus = "pre_approved";
      mockDocumentMetadata = {
        pre_approved_by: "user-advisor-001", // Different user
      };

      const req = createMockRequest(
        { documentId: "doc-001" },
        {},
        { id: "user-random-999", role: "student" }
      );
      const res = createMockResponse();

      await revertPreApproval(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.jsonData.success).toBe(false);
    });

    it("should create an audit log entry on revert", async () => {
      mockDocumentStatus = "pre_approved";
      mockDocumentMetadata = {
        content_hash: "abc123",
        pre_approved_at: "2026-01-01T00:00:00Z",
        pre_approved_by: "user-admin-001",
      };

      const req = createMockRequest(
        { documentId: "doc-001" },
        { reason: "Corrections needed" },
        { id: "user-admin-001", role: "admin" }
      );
      const res = createMockResponse();

      await revertPreApproval(req, res);

      expect(mockLogAction).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: "doc-001",
          action: "pre_approval_reverted",
          metadata: expect.objectContaining({
            reason: "Corrections needed",
            previous_status: "pre_approved",
            new_status: "draft",
          }),
        })
      );
    });
  });

  // ===========================================================================
  // SHA-256 Content Hash Consistency Tests
  // ===========================================================================
  describe("SHA-256 Content Hash", () => {
    it("should produce the same hash for the same content", () => {
      const content = { type: "doc", content: [{ type: "text", text: "test" }] };
      const contentStr = JSON.stringify(content);

      const hash1 = crypto.createHash("sha256").update(contentStr, "utf8").digest("hex");
      const hash2 = crypto.createHash("sha256").update(contentStr, "utf8").digest("hex");

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different content", () => {
      const content1 = JSON.stringify({ text: "version 1" });
      const content2 = JSON.stringify({ text: "version 2" });

      const hash1 = crypto.createHash("sha256").update(content1, "utf8").digest("hex");
      const hash2 = crypto.createHash("sha256").update(content2, "utf8").digest("hex");

      expect(hash1).not.toBe(hash2);
    });

    it("should produce 64-character hex string", () => {
      const hash = crypto.createHash("sha256").update("any content", "utf8").digest("hex");

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });
});
