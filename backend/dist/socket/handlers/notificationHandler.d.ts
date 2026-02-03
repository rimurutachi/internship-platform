import { Server, Socket } from "socket.io";
interface AuthenticatedSocket extends Socket {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare const setupNotificationHandlers: (io: Server, socket: AuthenticatedSocket) => void;
export {};
//# sourceMappingURL=notificationHandler.d.ts.map