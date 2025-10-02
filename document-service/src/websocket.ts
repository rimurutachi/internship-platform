import { Server as SocketServer, Socket} from 'socket.io';
import * as Y from 'yjs';
import { Redis } from 'ioredis';
import { env } from './config/env';

const redis = new Redis(env.REDIS_URL);
const documents = new Map<string, Y.Doc>();

export function setupWebSocket(io: SocketServer) {
    io.on('connection', (socket:Socket) => {
        console.log(`Client connected: ${socket.id}`);

    // Join document room
    socket.on('document:join', async({ documentId, userId}) => {
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
    socket.on('document:update', async({ documentId, update }) => {
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
};