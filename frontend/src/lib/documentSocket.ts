import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectDocumentService(documentId: string, userId: string) {
    if(!socket) {
        socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:6000');
    }

    socket.emit('document:join', { documentId, userId });

    return socket;
}

export function disconnectDocumentService(documentId: string, userId: string) {
    if(socket) {
        socket.emit('document:leave', { documentId, userId });
        socket.disconnect();
        socket = null;
    }
}