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
export async function connectDocumentService(
  documentId: string,
  userId: string,
  userName?: string,
  userEmail?: string
): Promise<Socket> {
  try {
    // Socket.io client uses HTTP protocol, NOT ws://
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:6001';
    
    console.log('🔵 [DocumentSocket] Connecting to:', websocketUrl);
    
    if (!socket || !socket.connected) {
      // SECURITY: Get authentication token from Supabase
      const { createSupabaseClient } = await import('@/lib/supabase');
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available. Please login first.');
      }

      socket = io(websocketUrl, {
        transports: ['websocket', 'polling'], // Allow fallback to polling
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        auth: {
          token: session.access_token, // Pass JWT token for authentication
        },
      });

      // Handle connection errors
      socket.on('connect_error', (error) => {
        console.error('❌ [DocumentSocket] Connection error:', error);
      });

      socket.on('disconnect', (reason) => {
        console.warn('⚠️ [DocumentSocket] Disconnected:', reason);
      });
      
      socket.on('connect', async () => {
        console.log('🟢 [DocumentSocket] Connected successfully');

        try {
          // Derive user info if not provided
          let name = userName;
          let email = userEmail;
          if (!name || !email) {
            const { createSupabaseClient } = await import('@/lib/supabase');
            const supabase = createSupabaseClient();
            const { data: { user } } = await supabase.auth.getUser();
            email = email || user?.email || 'unknown@example.com';
            const meta = (user?.user_metadata as any) || {};
            name = name || meta.full_name || [meta.first_name, meta.last_name].filter(Boolean).join(' ') || 'Unknown';
          }

          // Only join specific document if it's a valid page context
          if (documentId && documentId !== 'documents-list') {
            socket!.emit('document:join', { documentId, userId, userName: name, userEmail: email });
          }
        } catch (e) {
          console.warn('[DocumentSocket] Failed to enrich join payload:', e);
          if (documentId && documentId !== 'documents-list') {
            socket!.emit('document:join', { documentId, userId });
          }
        }
      });
    } else {
      // Already connected: emit join immediately (best-effort enrich)
      if (documentId && documentId !== 'documents-list') {
        socket.emit('document:join', { documentId, userId, userName, userEmail });
      }
    }

    return socket;
  } catch (error) {
    console.error('Error connecting to document service:', error);
    throw new Error('Failed to connect to document service');
  }
}

/**
 * Connects to document service for general updates (not specific document)
 * Use this for list pages where you just want to listen for updates
 * 
 * @returns Socket instance
 */
export async function connectForUpdates(): Promise<Socket> {
  try {
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:6001';
    
    console.log('🔵 [DocumentSocket] Connecting for general updates...');
    
    if (!socket || !socket.connected) {
      // SECURITY: Get authentication token from Supabase
      const { createSupabaseClient } = await import('@/lib/supabase');
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available. Please login first.');
      }

      socket = io(websocketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        auth: {
          token: session.access_token, // Pass JWT token for authentication
        },
      });

      socket.on('connect_error', (error) => {
        console.error('❌ [DocumentSocket] Connection error:', error);
      });

      socket.on('disconnect', (reason) => {
        console.warn('⚠️ [DocumentSocket] Disconnected:', reason);
      });
      
      socket.on('connect', () => {
        console.log('🟢 [DocumentSocket] Connected for updates');
      });
    }

    // Don't emit document:join for general updates
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