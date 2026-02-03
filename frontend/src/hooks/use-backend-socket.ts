/**
 * React Hooks for Backend Socket Integration
 * 
 * Custom hooks for managing real-time socket connections
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  connectBackendSocket,
  disconnectBackendSocket,
  getBackendSocket,
  onSocketEvent,
  joinConversation,
  leaveConversation,
  watchEvaluation,
  unwatchEvaluation,
  sendTypingIndicator,
  type BackendSocketEvents,
} from '@/lib/backendSocket';

/**
 * Hook to establish and manage backend socket connection
 * Automatically connects on mount and disconnects on unmount
 * 
 * @returns Socket connection status
 */
export function useBackendSocket() {
  const socketRef = useRef<ReturnType<typeof getBackendSocket>>(null);

  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      try {
        const socket = await connectBackendSocket();
        if (mounted) {
          socketRef.current = socket;
        }
      } catch (error) {
        console.error('[useBackendSocket] Connection failed:', error);
      }
    };

    connect();

    return () => {
      mounted = false;
      // Don't disconnect here - keep connection alive for other components
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
  };
}

/**
 * Hook to listen to specific socket events
 * 
 * @param event - Event name to listen to
 * @param handler - Event handler function
 */
export function useSocketEvent<K extends keyof BackendSocketEvents>(
  event: K,
  handler: BackendSocketEvents[K]
) {
  useEffect(() => {
    const cleanup = onSocketEvent(event, handler);
    return cleanup;
  }, [event, handler]);
}

/**
 * Hook to manage conversation room subscription
 * Automatically joins on mount and leaves on unmount
 * 
 * @param conversationId - Conversation ID to join
 * @param enabled - Whether to enable the subscription (default: true)
 */
export function useConversation(conversationId: string | null, enabled = true) {
  useEffect(() => {
    if (!enabled || !conversationId) return;

    let mounted = true;

    const join = async () => {
      if (mounted) {
        await joinConversation(conversationId);
      }
    };

    join();

    return () => {
      mounted = false;
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId, enabled]);
}

/**
 * Hook to manage evaluation watching
 * Automatically subscribes on mount and unsubscribes on unmount
 * 
 * @param evaluationId - Evaluation ID to watch
 * @param enabled - Whether to enable watching (default: true)
 */
export function useEvaluationWatch(evaluationId: string | null, enabled = true) {
  useEffect(() => {
    if (!enabled || !evaluationId) return;

    let mounted = true;

    const watch = async () => {
      if (mounted) {
        await watchEvaluation(evaluationId);
      }
    };

    watch();

    return () => {
      mounted = false;
      if (evaluationId) {
        unwatchEvaluation(evaluationId);
      }
    };
  }, [evaluationId, enabled]);
}

/**
 * Hook to manage typing indicators
 * 
 * @param conversationId - Conversation ID
 * @returns Function to send typing indicator
 */
export function useTypingIndicator(conversationId: string | null) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      sendTypingIndicator(conversationId, isTyping);

      // Auto-stop typing after 3 seconds
      if (isTyping) {
        timeoutRef.current = setTimeout(() => {
          sendTypingIndicator(conversationId, false);
        }, 3000);
      }
    },
    [conversationId]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return setTyping;
}
