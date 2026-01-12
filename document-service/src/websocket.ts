import { Server as SocketServer, Socket } from "socket.io";
import * as Y from "yjs";
import { Redis } from "ioredis";
import { env } from "./config/env";
import collaborationService from "./services/collaborationService";

const redis = new Redis(env.REDIS_URL);
const documents = new Map<string, Y.Doc>();

export function setupWebSocket(io: SocketServer) {
  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    let currentSession: { sessionId: string; color: string } | null = null;
    let currentDocumentId: string | null = null;
    let currentUserId: string | null = null;

    socket.on("document:join", async ({ documentId, userId, userName, userEmail, userColor }) => {
      try {
        socket.join(documentId);

        // Track current context
        currentDocumentId = documentId;
        currentUserId = userId;

        // Initialize collaboration session in DB
        currentSession = await collaborationService.initializeSession(
          documentId,
          userId,
          userName || "Unknown",
          userEmail || "unknown@example.com"
        );

        // Get or create Y.Doc
        if (!documents.has(documentId)) {
          documents.set(documentId, new Y.Doc());
        }

        // Get active collaborators
        const activeUsers = await collaborationService.getActiveUsers(documentId);

        // Notify others
        socket.to(documentId).emit("user:joined", {
          userId,
          socketId: socket.id,
          userColor: currentSession.color,
        });

        // Send active users to new joiner
        socket.emit("active:users", activeUsers);

        console.log(`User ${userId} joined document ${documentId}`);
      } catch (error) {
        console.error("Error joining document:", error);
        socket.emit("error", { message: "Failed to join document" });
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
          // Broadcast update to other clients
          socket.to(documentId).emit("document:update", { update, userId });

          // Persist change to database via collaboration service
          const index = typeof position === "number" ? position : (position?.index ?? 0);
          await collaborationService.recordChange({
            documentId,
            userId,
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
          console.error("Error handling update:", error);
        }
      }
    );

    // Handle cursor updates
    socket.on(
      "cursor:update",
      async ({ documentId, position, userId, selectionRange }) => {
        try {
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
            userId,
            position,
            selectionRange,
            socketId: socket.id,
          });
        } catch (error) {
          console.error("Error updating error:", error);
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

        socket.to(documentId).emit("user:left", { userId });
      } catch (error) {
        console.error("Error leaving document:", error);
      }
    });

    // Disconnect
    socket.on("disconnect", async () => {
      try {
        // Clean up session
        if (currentSession && currentDocumentId && currentUserId) {
          await collaborationService.endSession(currentDocumentId, currentUserId, currentSession.sessionId);
        }
        console.log(`Client disconnected: ${socket.id}`);
      } catch (error) {
        console.error("Error on disconnect:", error);
      }
    });
  });

  // Note: Stale session cleanup handled at the service/database level
}
