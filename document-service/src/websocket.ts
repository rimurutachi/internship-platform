import { Server as SocketServer, Socket } from "socket.io";
import * as Y from "yjs";
import { Redis } from "ioredis";
import { createClient } from "@supabase/supabase-js";
import { env } from "./config/env";
import collaborationService from "./services/collaborationService";

// Configure Redis connection (no SSL required for this endpoint)
const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  connectTimeout: 10000,
  enableReadyCheck: true,
  enableOfflineQueue: true,
});

// Redis connection event handlers
redis.on('connect', () => {
  console.log('✅ Document Service Redis connected');
});

redis.on('ready', () => {
  console.log('✅ Document Service Redis ready');
});

redis.on('error', (err) => {
  console.error('❌ Document Service Redis error:', err.message);
});

redis.on('close', () => {
  console.warn('⚠️ Document Service Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Document Service Redis reconnecting...');
});

const documents = new Map<string, Y.Doc>();

// =============================================================================
// SECURITY: Supabase client for JWT verification
// =============================================================================
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

/**
 * SECURITY: Verify JWT token and extract user info
 * Returns null if token is invalid or expired
 */
async function verifyToken(token: string): Promise<{ id: string; email: string; role: string } | null> {
  try {
    if (!token) return null;
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.warn("⚠️ WebSocket auth failed: Invalid or expired token");
      return null;
    }
    
    // Get user role from database
    const { data: userProfile } = await supabase
      .from("users")
      .select("role, status")
      .eq("id", user.id)
      .single();
    
    if (!userProfile || userProfile.status === 'suspended' || userProfile.status === 'inactive') {
      console.warn(`⚠️ WebSocket auth failed: User ${user.id} status is ${userProfile?.status || 'not found'}`);
      return null;
    }
    
    return {
      id: user.id,
      email: user.email || "",
      role: userProfile.role
    };
  } catch (error) {
    console.error("❌ WebSocket token verification error:", error);
    return null;
  }
}

/**
 * SECURITY: Check if user has access to a document
 */
async function checkDocumentAccess(documentId: string, userId: string, userRole: string): Promise<boolean> {
  try {
    // Admins have access to all documents
    if (userRole === 'admin') return true;
    
    // Check if user owns the document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, owner_id")
      .eq("id", documentId)
      .single();
    
    if (docError || !doc) {
      console.warn(`⚠️ Document ${documentId} not found`);
      return false;
    }
    
    if (doc.owner_id === userId) return true;
    
    // Check explicit access control
    const { data: dac } = await supabase
      .from("document_access_control")
      .select("permission_level, expires_at, revoked_at")
      .eq("document_id", documentId)
      .eq("user_id", userId)
      .is("revoked_at", null)
      .limit(1)
      .maybeSingle();
    
    if (!dac) return false;
    if (dac.expires_at && new Date(dac.expires_at) < new Date()) return false;
    
    return true;
  } catch (error) {
    console.error("❌ Document access check error:", error);
    return false;
  }
}

// Extended socket type with authenticated user
interface AuthenticatedSocket extends Socket {
  user?: { id: string; email: string; role: string };
}

export function setupWebSocket(io: SocketServer) {
  // =============================================================================
  // SECURITY: Connection-level authentication middleware
  // =============================================================================
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token as string;
      
      if (!token) {
        console.warn(`⚠️ WebSocket connection rejected: No token provided (socket: ${socket.id})`);
        return next(new Error("Authentication required. Please provide a valid token."));
      }
      
      const user = await verifyToken(token);
      
      if (!user) {
        console.warn(`⚠️ WebSocket connection rejected: Invalid token (socket: ${socket.id})`);
        return next(new Error("Authentication failed. Token is invalid or expired."));
      }
      
      // Attach user to socket for later use
      socket.user = user;
      console.log(`✅ WebSocket authenticated: User ${user.id} (${user.role})`);
      next();
    } catch (error) {
      console.error("❌ WebSocket authentication error:", error);
      next(new Error("Authentication error. Please try again."));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`🔌 Client connected: ${socket.id} (User: ${socket.user?.id || 'unknown'})`);

    let currentSession: { sessionId: string; color: string } | null = null;
    let currentDocumentId: string | null = null;
    let currentUserId: string | null = null;

    socket.on("document:join", async ({ documentId, userId, userName, userEmail, userColor }) => {
      try {
        // =============================================================================
        // SECURITY: Verify user identity matches authenticated token
        // =============================================================================
        if (!socket.user) {
          console.warn(`🔴 SECURITY: Unauthenticated socket tried to join document ${documentId}`);
          socket.emit("error", { message: "Authentication required", code: "AUTH_REQUIRED" });
          return;
        }
        
        // SECURITY: Prevent impersonation - userId must match authenticated user
        if (socket.user.id !== userId) {
          console.warn(`🔴 SECURITY: User ${socket.user.id} tried to impersonate ${userId} for document ${documentId}`);
          socket.emit("error", { message: "User ID mismatch. Cannot join as another user.", code: "USER_MISMATCH" });
          return;
        }
        
        // SECURITY: Check document access permissions
        const hasAccess = await checkDocumentAccess(documentId, socket.user.id, socket.user.role);
        if (!hasAccess) {
          console.warn(`🔴 SECURITY: User ${socket.user.id} denied access to document ${documentId}`);
          socket.emit("error", { message: "Access denied. You do not have permission to view this document.", code: "ACCESS_DENIED" });
          return;
        }
        
        socket.join(documentId);

        // Track current context
        currentDocumentId = documentId;
        currentUserId = socket.user.id; // Use authenticated userId

        // Initialize collaboration session in DB
        currentSession = await collaborationService.initializeSession(
          documentId,
          socket.user.id,
          userName || socket.user.email?.split('@')[0] || "Unknown",
          userEmail || socket.user.email || "unknown@example.com"
        );

        // Get or create Y.Doc
        if (!documents.has(documentId)) {
          documents.set(documentId, new Y.Doc());
        }

        // Get active collaborators
        const activeUsers = await collaborationService.getActiveUsers(documentId);

        // Notify others
        socket.to(documentId).emit("user:joined", {
          userId: socket.user.id,
          socketId: socket.id,
          userColor: currentSession.color,
        });

        // Send active users to new joiner
        socket.emit("active:users", activeUsers);

        console.log(`✅ User ${socket.user.id} joined document ${documentId}`);
      } catch (error) {
        console.error("❌ Error joining document:", error);
        socket.emit("error", { message: "Failed to join document", code: "JOIN_ERROR" });
      }
    });

    // Handle document updates
    socket.on(
      "document:update",
      async ({
        documentId,
        update,
        userId,
        operationType,
        position,
        content,
      }) => {
        try {
          // SECURITY: Verify user is authenticated and matches
          if (!socket.user || socket.user.id !== userId) {
            console.warn(`🔴 SECURITY: Unauthorized update attempt on document ${documentId}`);
            socket.emit("error", { message: "Unauthorized", code: "UNAUTHORIZED" });
            return;
          }
          
          // Broadcast update to other clients
          socket.to(documentId).emit("document:update", { update, userId: socket.user.id });

          // Persist change to database via collaboration service
          const index = typeof position === "number" ? position : (position?.index ?? 0);
          await collaborationService.recordChange({
            documentId,
            userId: socket.user.id,
            operation: operationType,
            index,
            content,
            timestamp: new Date().toISOString(),
            metadata: {},
          });

          // Persist to Redis
          await redis.lpush(
            `doc:${documentId}:updates`,
            JSON.stringify(update)
          );
        } catch (error) {
          console.error("❌ Error handling update:", error);
        }
      }
    );

    // Handle cursor updates
    socket.on(
      "cursor:update",
      async ({ documentId, position, userId, selectionRange }) => {
        try {
          // SECURITY: Verify user matches
          if (!socket.user || socket.user.id !== userId) {
            return; // Silently ignore unauthorized cursor updates
          }
          
          // Update in database if session exists
          if (currentSession && currentDocumentId && currentUserId) {
            await collaborationService.updatePresence(
              currentDocumentId,
              currentUserId,
              { cursorPosition: position }
            );
          }

          // Broadcast to other clients
          socket.to(documentId).emit("cursor:update", {
            userId: socket.user.id,
            position,
            selectionRange,
            socketId: socket.id,
          });
        } catch (error) {
          console.error("❌ Error updating cursor:", error);
        }
      }
    );

    // Leave document
    socket.on("document:leave", async ({ documentId, userId }) => {
      try {
        socket.leave(documentId);

        // End session in database
        if (currentSession && currentDocumentId && currentUserId) {
          await collaborationService.endSession(currentDocumentId, currentUserId, currentSession.sessionId);
        }

        socket.to(documentId).emit("user:left", { userId: socket.user?.id || userId });
        console.log(`📤 User ${socket.user?.id || userId} left document ${documentId}`);
      } catch (error) {
        console.error("❌ Error leaving document:", error);
      }
    });

    // Disconnect
    socket.on("disconnect", async () => {
      try {
        // Clean up session
        if (currentSession && currentDocumentId && currentUserId) {
          await collaborationService.endSession(currentDocumentId, currentUserId, currentSession.sessionId);
        }
        console.log(`🔌 Client disconnected: ${socket.id} (User: ${socket.user?.id || 'unknown'})`);
      } catch (error) {
        console.error("❌ Error on disconnect:", error);
      }
    });
  });

  // Note: Stale session cleanup handled at the service/database level
}
