/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * React Hooks for Backend Socket Integration
 * 
 * Custom hooks for managing real-time socket connections
 */

import { useEffect, useRef } from 'react';
import {
  connectBackendSocket,
  disconnectBackendSocket,
  getBackendSocket,
  onSocketEvent,
  watchEvaluation,
  unwatchEvaluation,
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
