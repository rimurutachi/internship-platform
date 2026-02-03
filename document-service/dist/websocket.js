"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
const Y = __importStar(require("yjs"));
const ioredis_1 = require("ioredis");
const env_1 = require("./config/env");
const collaborationService_1 = __importDefault(require("./services/collaborationService"));
const redis = new ioredis_1.Redis(env_1.env.REDIS_URL);
const documents = new Map();
function setupWebSocket(io) {
    io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`);
        let currentSession = null;
        let currentDocumentId = null;
        let currentUserId = null;
        socket.on("document:join", async ({ documentId, userId, userName, userEmail, userColor }) => {
            try {
                socket.join(documentId);
                // Track current context
                currentDocumentId = documentId;
                currentUserId = userId;
                // Initialize collaboration session in DB
                currentSession = await collaborationService_1.default.initializeSession(documentId, userId, userName || "Unknown", userEmail || "unknown@example.com");
                // Get or create Y.Doc
                if (!documents.has(documentId)) {
                    documents.set(documentId, new Y.Doc());
                }
                // Get active collaborators
                const activeUsers = await collaborationService_1.default.getActiveUsers(documentId);
                // Notify others
                socket.to(documentId).emit("user:joined", {
                    userId,
                    socketId: socket.id,
                    userColor: currentSession.color,
                });
                // Send active users to new joiner
                socket.emit("active:users", activeUsers);
                console.log(`User ${userId} joined document ${documentId}`);
            }
            catch (error) {
                console.error("Error joining document:", error);
                socket.emit("error", { message: "Failed to join document" });
            }
        });
        // Handle document updates
        socket.on("document:update", async ({ documentId, update, userId, operationType, position, content, }) => {
            try {
                // Broadcast update to other clients
                socket.to(documentId).emit("document:update", { update, userId });
                // Persist change to database via collaboration service
                const index = typeof position === "number" ? position : (position?.index ?? 0);
                await collaborationService_1.default.recordChange({
                    documentId,
                    userId,
                    operation: operationType,
                    index,
                    content,
                    timestamp: new Date().toISOString(),
                    metadata: {},
                });
                // Persist to Redis
                await redis.lpush(`doc:${documentId}:updates`, JSON.stringify(update));
            }
            catch (error) {
                console.error("Error handling update:", error);
            }
        });
        // Handle cursor updates
        socket.on("cursor:update", async ({ documentId, position, userId, selectionRange }) => {
            try {
                // Update in database if session exists
                if (currentSession && currentDocumentId && currentUserId) {
                    await collaborationService_1.default.updatePresence(currentDocumentId, currentUserId, { cursorPosition: position });
                }
                // Broadcast to other clients
                socket.to(documentId).emit("cursor:update", {
                    userId,
                    position,
                    selectionRange,
                    socketId: socket.id,
                });
            }
            catch (error) {
                console.error("Error updating error:", error);
            }
        });
        // Leave document
        socket.on("document:leave", async ({ documentId, userId }) => {
            try {
                socket.leave(documentId);
                // End session in database
                if (currentSession && currentDocumentId && currentUserId) {
                    await collaborationService_1.default.endSession(currentDocumentId, currentUserId, currentSession.sessionId);
                }
                socket.to(documentId).emit("user:left", { userId });
            }
            catch (error) {
                console.error("Error leaving document:", error);
            }
        });
        // Disconnect
        socket.on("disconnect", async () => {
            try {
                // Clean up session
                if (currentSession && currentDocumentId && currentUserId) {
                    await collaborationService_1.default.endSession(currentDocumentId, currentUserId, currentSession.sessionId);
                }
                console.log(`Client disconnected: ${socket.id}`);
            }
            catch (error) {
                console.error("Error on disconnect:", error);
            }
        });
    });
    // Note: Stale session cleanup handled at the service/database level
}
