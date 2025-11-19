/**
 * Backend Socket.io Service
 * 
 * Manages real-time communication with the backend service
 * Handles messages, notifications, and evaluation updates
 */

import { io, Socket } from 'socket.io-client';
import { createSupabaseClient } from '@/lib/supabase';
import type { Message, Notification, Evaluation } from '@/types/api';

/**
 * Socket event types
 */
export interface BackendSocketEvents {
  // Message events
  'message:sent': (message: Message) => void;
  'message:updated': (message: Message) => void;
  'message:read': (data: { message_id: string; read_by: string }) => void;
  
  // Notification events
  'notification:new': (notification: Notification) => void;
  'notification:read': (data: { notification_id: string }) => void;
  
  // Evaluation events
  'evaluation:created': (evaluation: Evaluation) => void;
  'evaluation:updated': (evaluation: Evaluation) => void;
  'evaluation:submitted': (evaluation: Evaluation) => void;
  
  // Connection events
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'error': (error: Error) => void;
}

/**
 * Socket connection instance
 */
let socket: Socket | null = null;

/**
 * Socket connection state
 */
let isConnecting = false;

/**
 * Connects to the backend Socket.io service
 * 
 * @returns Socket instance
 */
export async function connectBackendSocket(): Promise<Socket> {
  // Return existing socket if already connected
  if (socket?.connected) {
    return socket;
  }

  // Prevent multiple concurrent connection attempts
  if (isConnecting) {
    return new Promise((resolve) => {
      const checkConnection = setInterval(() => {
        if (socket?.connected) {
          clearInterval(checkConnection);
          resolve(socket);
        }
      }, 100);
    });
  }

  try {
    isConnecting = true;

    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_SOCKET_URL || 'http://localhost:5000';
    
    // Get auth token
    const supabase = createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    socket = io(socketUrl, {
      auth: {
        token: session?.access_token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[Backend Socket] Connected');
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Backend Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Backend Socket] Connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('[Backend Socket] Error:', error);
    });

    isConnecting = false;
    return socket;
  } catch (error) {
    isConnecting = false;
    console.error('[Backend Socket] Failed to connect:', error);
    throw new Error('Failed to connect to backend socket service');
  }
}

/**
 * Disconnects from the backend Socket.io service
 */
export function disconnectBackendSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Gets the current backend socket instance
 * 
 * @returns Socket instance or null if not connected
 */
export function getBackendSocket(): Socket | null {
  return socket;
}

/**
 * Subscribe to a conversation room
 * 
 * @param conversationId - The conversation ID to join
 */
export async function joinConversation(conversationId: string): Promise<void> {
  const socket = await connectBackendSocket();
  socket.emit('conversation:join', { conversation_id: conversationId });
}

/**
 * Leave a conversation room
 * 
 * @param conversationId - The conversation ID to leave
 */
export function leaveConversation(conversationId: string): void {
  if (socket?.connected) {
    socket.emit('conversation:leave', { conversation_id: conversationId });
  }
}

/**
 * Subscribe to evaluation updates
 * 
 * @param evaluationId - The evaluation ID to watch
 */
export async function watchEvaluation(evaluationId: string): Promise<void> {
  const socket = await connectBackendSocket();
  socket.emit('evaluation:watch', { evaluation_id: evaluationId });
}

/**
 * Unsubscribe from evaluation updates
 * 
 * @param evaluationId - The evaluation ID to stop watching
 */
export function unwatchEvaluation(evaluationId: string): void {
  if (socket?.connected) {
    socket.emit('evaluation:unwatch', { evaluation_id: evaluationId });
  }
}

/**
 * Subscribe to user-specific notifications
 * This is automatically done when connecting, but can be called manually
 */
export async function subscribeToNotifications(): Promise<void> {
  const socket = await connectBackendSocket();
  socket.emit('notification:subscribe');
}

/**
 * Send typing indicator
 * 
 * @param conversationId - The conversation ID
 * @param isTyping - Whether the user is typing
 */
export function sendTypingIndicator(conversationId: string, isTyping: boolean): void {
  if (socket?.connected) {
    socket.emit('typing', { conversation_id: conversationId, is_typing: isTyping });
  }
}

/**
 * Hook for listening to socket events
 * 
 * @param event - Event name
 * @param handler - Event handler function
 * @returns Cleanup function to remove the listener
 */
export function onSocketEvent<K extends keyof BackendSocketEvents>(
  event: K,
  handler: BackendSocketEvents[K]
): () => void {
  if (!socket) {
    console.warn(`[Backend Socket] Attempted to listen to ${event} before connection`);
    return () => {};
  }

  socket.on(event, handler as any);
  
  return () => {
    if (socket) {
      socket.off(event, handler as any);
    }
  };
}

/**
 * Auto-reconnect with fresh token if authentication fails
 */
export async function reconnectWithFreshToken(): Promise<void> {
  disconnectBackendSocket();
  await connectBackendSocket();
}
