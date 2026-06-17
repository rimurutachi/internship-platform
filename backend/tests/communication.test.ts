import request from "supertest";
import jwt from "jsonwebtoken";

// Force test environment and minimal secrets/mocks
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost/fake";
process.env.SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || "service-key";

// Mock auth middleware to bypass Supabase network calls and attach req.user
jest.mock("../src/middleware/auth", () => {
  return {
    authenticateToken: (req: any, _res: any, next: any) => {
      const auth = req.headers["authorization"] || "";
      const token = (auth as string).replace("Bearer ", "");
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        };
      } catch (_) {
        req.user = undefined;
      }
      next();
    },
    requireRole:
      (_roles: string[]) => (req: any, res: any, next: any) => next(),
  };
});

// Mock services used by controller
jest.mock("../src/services/messageService", () => ({
  __esModule: true,
  default: {
    sendMessage: jest.fn(async (_userId: string, body: any) => ({
      id: "11111111-1111-4111-8111-111111111111",
      conversation_id: body.conversation_id,
      content: body.content.trim().slice(0, 5000),
      message_type: body.message_type || "text",
      is_edited: false,
    })),
    getMessages: jest.fn(async (_conversationId: string, _l: number, _o: number) => [
      { id: "m1", content: "hello" },
    ]),
    editMessage: jest.fn(async (messageId: string, _userId: string, content: string) => ({
      id: messageId,
      content,
      is_edited: true,
    })),
    deleteMessage: jest.fn(async () => undefined),
  },
}));

jest.mock("../src/services/conversationService", () => ({
  __esModule: true,
  default: {
    createConversation: jest.fn(async (_userId: string, body: any) => ({
      id: "22222222-2222-4222-8222-222222222222",
      type: body.type,
      name: body.name,
      participant_ids: body.participant_ids,
    })),
    getUserConversations: jest.fn(async (_userId: string) => []),
    getConversation: jest.fn(async (conversationId: string) => ({ id: conversationId })),
    markAsRead: jest.fn(async () => undefined),
    getUnreadCount: jest.fn(async () => 3),
  },
}));

jest.mock("../src/services/notificationService", () => {
  const mockInstance = {
    createNotification: jest.fn(async (body: any) => ({
      id: "33333333-3333-4333-8333-333333333333",
      ...body,
      is_read: false,
    })),
    getUserNotifications: jest.fn(async (_userId: string, _limit: number) => []),
    getUnreadNotificationsCount: jest.fn(async () => 5),
    markAsRead: jest.fn(async () => undefined),
    markAllAsRead: jest.fn(async () => undefined),
    deleteNotification: jest.fn(async () => undefined),
  };

  // Provide both the class (named export) and the default instance
  return {
    __esModule: true,
    NotificationService: jest.fn(() => mockInstance),
    default: mockInstance,
  };
});

// Mock validators to avoid Supabase calls but keep essential checks used by tests
jest.mock("../src/middleware/communciationValidators", () => {
  const pass = (_req: any, _res: any, next: any) => next();

  return {
    sanitizeMessageInput: pass,
    sanitizeConversationName: pass,
    validateCreateMessage: [pass],
    validateEditMessage: [pass],
    validateDeleteMessage: [pass],
    validateGetMessages: [pass],
    validateCreateConversation: [pass],
    validateGetConversation: [pass],
    validateMarkAsRead: [pass],
    validateGetNotifications: [pass],
    validateMarkNotificationAsRead: [pass],
    validateCreateNotification: [pass],
    validateConversationAccess: pass,
    validateMessageOwnership: pass,
    validateNotificationOwnership: pass,
  };
});

// Import app AFTER mocks
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require("../src/server").default;

const mockUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test@example.com",
  role: "student",
};

const adminUser = {
  id: "880e8400-e29b-41d4-a716-446655440088",
  email: "admin@example.com",
  role: "admin",
};

const generateToken = (user: any) =>
  jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: "1h" });

let authToken: string;
let adminToken: string;
let notificationId = "33333333-3333-4333-8333-333333333333";

describe("Communication API", () => {
  beforeAll(() => {
    authToken = generateToken(mockUser);
    adminToken = generateToken(adminUser);
  });

  /* ============================================================
   * Notification Tests
   * Route prefix: /api/communications (matches server.ts registration)
   * ============================================================ */
  describe("Notifications", () => {
    it("creates a notification (admin only)", async () => {
      const res = await request(app)
        .post("/api/communications/notifications")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          user_id: mockUser.id,
          type: "message",
          title: "New Message",
          message: "You have a new message",
          reference_type: "message",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      notificationId = res.body.data.id;
    });

    it("gets user notifications", async () => {
      const res = await request(app)
        .get("/api/communications/notifications")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ limit: 50 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("gets unread notifications count", async () => {
      const res = await request(app)
        .get("/api/communications/notifications/unread/count")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unread_count).toBeGreaterThanOrEqual(0);
    });

    it("marks single notification as read", async () => {
      const res = await request(app)
        .patch(`/api/communications/notifications/${notificationId}/read`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("marks all notifications as read", async () => {
      const res = await request(app)
        .patch("/api/communications/notifications/read-all")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("deletes a notification", async () => {
      const res = await request(app)
        .delete(`/api/communications/notifications/${notificationId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
