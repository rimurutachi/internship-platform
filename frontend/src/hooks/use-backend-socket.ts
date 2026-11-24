/**
 * React Hooks for Backend Socket Integration
 *
 * Custom hooks for managing real-time socket connections
 */

import { useEffect, useState } from 'react';
import {
  connectBackendSocket,
  getBackendSocket,
  onSocketEvent,
  watchEvaluation,
  unwatchEvaluation,
  type BackendSocketEvents,
} from '@/lib/backendSocket';

/**
 * Hook to establish and manage backend socket connection
 * Automatically connects on mount and tracks reactive connection state
 *
 * @returns Reactive Socket instance and connection status
 */
export function useBackendSocket() {
  const [socket, setSocket] = useState<ReturnType<typeof getBackendSocket>>(() =>
    getBackendSocket()
  );
  const [isConnected, setIsConnected] = useState<boolean>(
    () => getBackendSocket()?.connected ?? false
  );

  useEffect(() => {
    let mounted = true;
    let attachedSocket: ReturnType<typeof getBackendSocket> = null;

    const handleConnect = () => {
      if (mounted) setIsConnected(true);
    };

    const handleDisconnect = () => {
      if (mounted) setIsConnected(false);
    };

    const connect = async () => {
      try {
        const activeSocket = await connectBackendSocket();
        if (!mounted) return;
        attachedSocket = activeSocket;
        setSocket(activeSocket);
        setIsConnected(activeSocket.connected);

        activeSocket.on('connect', handleConnect);
        activeSocket.on('disconnect', handleDisconnect);
      } catch (error) {
        console.error('[useBackendSocket] Connection failed:', error);
      }
    };

    connect();

    return () => {
      mounted = false;
      if (attachedSocket) {
        attachedSocket.off('connect', handleConnect);
        attachedSocket.off('disconnect', handleDisconnect);
      }
    };
  }, []);

  return {
    socket,
    isConnected,
  };
}

/**
 * Hook to listen to specific socket events reactively once connected
 *
 * @param event - Event name to listen to
 * @param handler - Event handler function
 */
export function useSocketEvent<K extends keyof BackendSocketEvents>(
  event: K,
  handler: BackendSocketEvents[K]
) {
  const { socket } = useBackendSocket();

  useEffect(() => {
    if (!socket) return;
    const cleanup = onSocketEvent(event, handler);
    return cleanup;
  }, [socket, event, handler]);
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
