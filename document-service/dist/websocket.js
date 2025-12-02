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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
const Y = __importStar(require("yjs"));
const ioredis_1 = require("ioredis");
const env_1 = require("./config/env");
const redis = new ioredis_1.Redis(env_1.env.REDIS_URL);
const documents = new Map();
function setupWebSocket(io) {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);
        // Join document room
        socket.on('document:join', async ({ documentId, userId }) => {
            socket.join(documentId);
            // Get or create Y.Doc for this document
            if (!documents.has(documentId)) {
                documents.set(documentId, new Y.Doc());
            }
            // Notify others
            socket.to(documentId).emit('user:joined', {
                userId,
                socketId: socket.id
            });
            console.log(`User ${userId} joined document ${documentId}`);
        });
        // Handle document updates
        socket.on('document:update', async ({ documentId, update }) => {
            // Broadcast update to clients
            socket.to(documentId).emit('document:update', { update });
            // Save to Redis for persistence
            await redis.lpush(`doc:${documentId}:updates`, JSON.stringify(update));
        });
        // Handle cursor updates
        socket.on('cursor:update', ({ documentId, position, userId }) => {
            socket.to(documentId).emit('cursor:update', {
                userId,
                position,
                socketId: socket.id
            });
        });
        // Leave document
        socket.on('document:leave', ({ documentId, userId }) => {
            socket.leave(documentId);
            socket.to(documentId).emit('user:left', { userId });
        });
        // Disconnect client
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}
;
