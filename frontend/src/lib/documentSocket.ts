import { io, Socket } from 'socket.io-client';

/**
 * Document socket events
 */
export interface DocumentSocketEvents {
  'document:join': (data: { documentId: string; userId: string }) => void;
  'document:leave': (data: { documentId: string; userId: string }) => void;
  'document:update': (data: unknown) => void;
  'document:error': (error: { message: string }) => void;
}

/**
 * Socket instance for document collaboration
 */
let socket: Socket | null = null;

/**
 * Gets or creates a socket connection for document collaboration
 * 
 * @param documentId - The document ID to connect to
 * @param userId - The user ID connecting to the document
 * @returns Socket instance
 * @throws Error if connection fails
 */
export function connectDocumentService(
  documentId: string,
  userId: string
): Socket {
  try {
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:6000';
    
    if (!socket || !socket.connected) {
      socket = io(websocketUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      // Handle connection errors
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socket.on('disconnect', (reason) => {
        console.warn('Socket disconnected:', reason);
      });
    }

    // Join the document room
    socket.emit('document:join', { documentId, userId });

    return socket;
  } catch (error) {
    console.error('Error connecting to document service:', error);
    throw new Error('Failed to connect to document service');
  }
}

/**
 * Disconnects from the document service
 * 
 * @param documentId - The document ID to leave
 * @param userId - The user ID leaving the document
 */
export function disconnectDocumentService(
  documentId: string,
  userId: string
): void {
  try {
    if (socket && socket.connected) {
      socket.emit('document:leave', { documentId, userId });
      socket.disconnect();
    }
    socket = null;
  } catch (error) {
    console.error('Error disconnecting from document service:', error);
  }
}

/**
 * Gets the current socket instance
 * 
 * @returns Socket instance or null if not connected
 */
export function getDocumentSocket(): Socket | null {
  return socket;
}